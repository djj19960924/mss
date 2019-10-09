import React from 'react';
import {withRouter} from 'react-router-dom';
import {Form, Select, Input, InputNumber, message, DatePicker, Icon} from 'antd';
import moment from 'moment';
import {inject, observer} from 'mobx-react/index';
import './index.less';

@withRouter @inject('appStore') @observer @Form.create()
class AuditTicketModel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 韩国 SG/MG 类型, 0:SG; 1:MG
      status: 1,
      // 当前商场
      mallName: '',
      // 商场列表
      shopList: [],
      // 所选小票日期
      consumeDate: moment(new Date()).format('YYYY-MM-DD'),
      // 汇率loading
      rateLoading: false,
      // 小票列表
      receiptList: [],
      // 当前小票
      currentReceiptNo: 0,
      // 小票总数
      receiptTotal: 0,
      // 读取小票loading
      receiptLoading: false,
      koreaRate:0,
      americaRate:0,
    };
  }

  componentDidMount() {
    // 注册至父级页面
    const {onRef} = this.props;
    onRef(this);
    this.getMallListByNationName();
    this.getReciptByMallName();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 当切换小票逻辑时触发(自营/客户)
    if (prevProps.checkChoice !== this.props.checkChoice) this.getReciptByMallName();
  }

  // 获取商场信息
  getMallListByNationName() {
    const {Option} = Select;
    // 判断韩国 SG/MG 类型
    const judgeStatus = (i,needErr) => {
      if (i.nationName === '韩国') {
        if (i.status === 0) {
          return 'SG';
        } else if (i.status === 1) {
          return 'MG';
        } else {
          if (needErr) message.error(`韩国商场 ${i.mallName} 类型错误, 请联系管理员`)
        }
      } else {
        return '';
      }
    };
    this.ajax.post('/mall/getMallListByNationName', {}).then(r => {
      const {status} = r.data;
      if (status === 10000) {
        const {data} = r.data, dataList = [];
        for (let i of data) {
          // 动态生成 Option, 满足依赖
          dataList.push(<Option key={i.mallName} reciptattribute={judgeStatus(i)}
                                country={i.nationName} status={i.status}
                                value={`${i.nationName}${judgeStatus(i, true)}${i.mallName}`}
          >{i.nationName}{judgeStatus(i, true)} - {i.mallName}</Option>);
        }
        this.setState({shopList: dataList});
      } else if (status < 10000) {
        this.setState({shopList: []});
      }
      this.setState({
        selectIsDisabled: false,
        selectIsLoading: false
      });
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 监听选择商店事件
  selectShop(val, option) {
    const {changeReceiptInfo} = this.props;
    const {setFieldsValue} = this.props.form;
    // console.log(val,option);
    // val即商场名, option.key即商场ID
    this.setState({
      mallName: option.key,
      country: option.props.country,
      status: option.props.status,
      reciptAttribute: option.props.reciptattribute
    },() => {
      this.getBrandListBymallName();
      this.getRateByCurrency();
      changeReceiptInfo({country:option.props.country});
      if (option.props.country === '韩国') setFieldsValue({reciptAttribute: option.props.reciptattribute})
    })
  }

  // 获取小票
  getReciptByMallName(){
    const {checkChoice, changeReceiptInfo} = this.props;
    const showLoading = Is => this.setState({receiptLoading: Is});
    // 每次模拟获取20张
    const data = {
      pageNum: 1,
      pageSize: 20,
      checkChoice
    };
    showLoading(true);
    this.ajax.post('/recipt/getReciptByMallName', data).then(r => {
      const {status, data} = r.data;
      let dataObj = {
        receiptList: [],
        receiptTotal: 0,
        currentReceiptNo: 0
      };
      if (status === 10000) {
        dataObj.receiptList = data.list;
        dataObj.receiptTotal = data.total;
      }
      changeReceiptInfo({
        receiptTotal: dataObj.receiptTotal,
        imgUrl: dataObj.receiptList.length > 0 ? dataObj.receiptList[0].pictureUrl : ''
      });
      this.setState(dataObj);
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 获取汇率
  getRateByCurrency() {
    const {country} = this.state;
    let currencyDiff;
    // 判断国别币种
    let koreaDiff = "韩国"

    if (country === '韩国') {
      currencyDiff = '美元';
    } else if (country === '日本') {
      currencyDiff = '日元';
    } else if (country === '法国') {
      currencyDiff = '欧元';
    } else {
      currencyDiff = '人民币'
    }
    const showLoading = Is => this.setState({rateLoading: Is});
    const data = {currency:currencyDiff,rateCurrency: '人民币'};
    const dataRate = {currency: '人民币',rateCurrency:(country==='韩国'?'韩币':currencyDiff)};
    if (currencyDiff === '人民币') {
      this.props.form.setFieldsValue({
        exchangeRate: 1
      });
    } else {
      showLoading(true);
      this.ajax.post('/rate/getRateByCurrency', data).then(r => {
        const {status, data} = r.data;
        if (status === 10000) {
          this.props.form.setFieldsValue({
            exchangeRate: data.rate,
          })
        }
        showLoading(false);
        r.showError();
      }).catch(r => {
        console.error(r);
        showLoading(false);
        this.ajax.isReturnLogin(r, this);
      });

      this.ajax.post('/rate/getRateByCurrency', dataRate).then(r => {
        const {status, data} = r.data;
        if (status === 10000) {
          window.setCookie('rate',data.rate,7200);
        }
        showLoading(false);
        r.showError();
      }).catch(r => {
        console.error(r);
        showLoading(false);
        this.ajax.isReturnLogin(r, this);
      });
    }
  }

  // 日期改变触发查询商场品牌
  changeConsumeDate(date) {
    this.setState({
      consumeDate: moment(date).format('YYYY-MM-DD')
    }, () => {
      this.getBrandListBymallName();
    });
  }

  // 查询商场品牌列表
  getBrandListBymallName() {
    const {Option} = Select;
    const {setFieldsValue} = this.props.form;
    const {mallName, consumeDate, status} = this.state;
    const data = {mallName, rebateDate: consumeDate, status};
    this.ajax.post('/brand/getBrandListBymallName', data).then(r => {
      const {status, data} = r.data
      if (status === 10000) {
        const list = [];
        for (let obj of data) {
          list.push(<Option name={obj.brandName} key={obj.brandId}
                            style={{textAlign: `center`}} title={obj.brandName}
                            value={obj.brandName}>{obj.brandName}</Option>)
        };
        this.setState({
          brandListOrigin: data,
          brandList: list
        },()=>{
          // 选择商场以后, 默认选取第一个品牌, 并获取该品牌当日返点率
          setFieldsValue({brandName: `${data[0].brandName}`});
          this.getRebateByDate(data[0].brandName);
        });
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 改变品牌触发
  changeBrand(val,tar) {
    this.getRebateByDate(tar.props.name)
  }

  // 获取指定日期下该商场品牌的返点率
  getRebateByDate(brandName) {
    const {setFieldsValue} = this.props.form;
    const {consumeDate, mallName} = this.state;
    const data = {brandName, rebateDate: consumeDate, mallName};
    this.ajax.post('/rebate/getRebateByDate', data).then(r => {
      const {status, data} = r.data;
      if (status === 10000) {
        setFieldsValue({rebateRate: data.rebateRate});
        this.changeMoney();
      };
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 更改返点金额
  changeMoney() {
    const {changeReceiptInfo} = this.props;
    const {setFieldsValue, getFieldValue} = this.props.form;
    // const {status} = this.state;
    this.setState({},()=>{
      // 属性/类型
      const reciptAttribute = getFieldValue('reciptAttribute'),
        // 消费金额(实际支付金额)
        consumeMoney = getFieldValue('consumeMoney') ? getFieldValue('consumeMoney') : 0,
        // 返点率
        rebateRate = getFieldValue('rebateRate') ? getFieldValue('rebateRate') : 0,
        // 原价美金
        originalPrice = getFieldValue('originalPrice') ? getFieldValue('originalPrice') : 0,
        // 汇率
        exchangeRate = getFieldValue('exchangeRate') ? getFieldValue('exchangeRate') : 1;
      const discountRate = (consumeMoney && originalPrice) ? (consumeMoney / originalPrice * 100) : 100;
      let reciptMoney, reciptDollar;
      if (reciptAttribute === 'MG') {
        reciptMoney = (originalPrice * (rebateRate / 100) - (originalPrice - consumeMoney)) * exchangeRate;
        reciptDollar = originalPrice * (rebateRate / 100) - (originalPrice - consumeMoney);
      } else {
        reciptMoney = rebateRate * consumeMoney / 100 * exchangeRate;
        reciptDollar = rebateRate * consumeMoney / 100;
      }
      const objectData = {reciptMoney, reciptDollar},
      objectDataInfo = {rebateRate};
      if (reciptAttribute === 'SG') {
        objectData.discountRate = discountRate;
        objectDataInfo.discountRate = discountRate;
      } else {
        objectDataInfo.discountRate = 100;
      }
      setFieldsValue(objectData);
      changeReceiptInfo(objectDataInfo);
    })
  }

  // 自定义表单验证汇率, 同时修正正确的显示值
  exchangeRateValidator(rule, val, callback) {
    let exchangeRate = parseFloat(document.querySelector('#exchangeRate').value);
    let thisRule;
    thisRule = /^\d+(\.\d{0,4})?$/;
    if (thisRule.test(val)) {
      if (parseFloat(val) < 999) {
        this.props.form.setFieldsValue({exchangeRate: parseFloat(val)});
        document.querySelector('#exchangeRate').value = exchangeRate;
        callback()
      } else {
        callback('汇率最大不可超过3位数')
      }
    } else if (!val) {
      callback('')
    } else {
      callback('汇率最多可输入小数点后四位')
    }
  }

  // 显示币种
  showCurrency(country) {
    let currency;
    // 判断国别币种
    if (country === '韩国') {
      currency = '美元';
    } else if (country === '日本') {
      currency = '日元';
    } else if (country === '法国') {
      currency = '欧元';
    } else {
      currency = '人民币'
    }
    return currency;
  }

  componentWillUnmount() {this.setState = () => null}
  render() {
    const FormItem = Form.Item, {getFieldDecorator, getFieldValue} = this.props.form;
    const {country, shopList, selectIsLoading, rateLoading, receiptTotal, receiptLoading, receiptList, brandList, currentReceiptNo, checkChoice} = this.state;
    return (
      <div className="AuditTicketModel">
        {receiptLoading
          && <div className="loadingInfo"><Icon type="loading"/> 小票加载中, 请稍后...</div>
        }
        {(receiptTotal > 0 && !receiptLoading)
          && <div className="formAndCost">
            <div className="title">-- 小票审核模块 --</div>
            <Form>
              <FormItem label="商场">
                {getFieldDecorator('mallName', {
                  rules: [
                    {required: true, message: '请选择商场!'}
                  ],
                })(
                  <Select className="mallName"
                          style={{width: 260, marginLeft: 10}}
                          placeholder={selectIsLoading ? "加载中请稍后..." : "请选择商场"}
                          onChange={this.selectShop.bind(this)}
                          showSearch
                          loading={selectIsLoading}
                          dropdownMatchSelectWidth={false}
                  >{shopList}</Select>
                )}
                {/*<div className="infoRed">(可输入商场名或商场id进行查询)</div>*/}
              </FormItem>
              {/*<FormItem label="支付币种">*/}
              {/*  {this.showCurrency(country)}*/}
              {/*</FormItem>*/}
              <FormItem label="小票申请人">
                {receiptList.length > 0 ? receiptList[currentReceiptNo].nickname : ''}
              </FormItem>
              {/*隐藏字段*/}
              {country === '韩国' && <FormItem label="小票类型">
                {getFieldDecorator('reciptAttribute',{
                  rules: [
                    {required: true}
                  ],
                })(
                  <Input disabled />
                )}
              </FormItem>}
              
              <FormItem label="请输入凭证号" disabled >
                {getFieldDecorator('teamNo', {
                  rules: [
                    {required: true, message: '请输入凭证号!'}
                  ],
                })(
                  <Input style={{width: 180, marginLeft: 10, color: '#555'}}
                         placeholder="请输入凭证号"
                         autoComplete="off"
                  />
                )}
              </FormItem>

              <FormItem label="小票购买时间">
                {getFieldDecorator('consumeDate', {
                  rules: [{required: true}],
                  initialValue: moment(new Date())
                })(
                  <DatePicker style={{width: 130, marginLeft: 10}}
                              dropdownClassName="datePickerPopup"
                              allowClear={false}
                              disabledDate={current => {
                                return current && current > moment().endOf('day')
                              }}
                              onChange={this.changeConsumeDate.bind(this)}
                  />
                )}
              </FormItem>

              {/*这里判断是否已选择商场/选择的商场类型*/}
              {!getFieldValue('mallName')
                ? <div className="infoRed">** 请先选择商场 **</div>
                : <div>
                  <FormItem label="汇率">
                    {getFieldDecorator('exchangeRate', {
                      rules: [
                        {required: true, message: '汇率不可为空!'},
                        {validator: this.exchangeRateValidator.bind(this)}
                      ]
                    })(
                      <InputNumber style={{width: 100, marginLeft: 10}}
                                   id="exchangeRate"
                                   placeholder="请输入汇率"
                        // 修正汇率触发修改
                        // onChange={() => this.changeReciptMoney()}
                      />
                    )}
                    {/*汇率加载loading*/}
                    {rateLoading &&
                    <span style={{color: 'rgba(0,0,0,.5)'}}>
                  <Icon type="loading" style={{marginLeft: 10}}/> 汇率获取中...
                </span>
                    }
                    {/*<div className="infoRed">(默认汇率可在 基础设置-汇率 内修改)</div>*/}
                  </FormItem>
                  <FormItem label="品牌">
                    {getFieldDecorator('brandName', {
                      rules: [
                        {required: true, message: '请选择品牌!'}
                      ],
                    })(
                      <Select style={{width: 260, marginLeft: 10}}
                              onChange={this.changeBrand.bind(this)}
                              placeholder="请选择品牌"
                      >{brandList}</Select>
                    )
                    }
                  </FormItem>
                  <FormItem label="返点率">
                    {getFieldDecorator('rebateRate', {
                      rules: [
                        {required: true, message: '请输入返点率!'}
                      ],
                    })(
                      <InputNumber style={{width: 120, marginLeft: 10}}
                                   min={0}
                                   max={99.9}
                                   precision={1}
                                   placeholder="请输入返点率"
                                   onChange={this.changeMoney.bind(this)}
                      />
                    )}
                    <span> %</span>
                  </FormItem>
                  <FormItem label={`实际支付金额(${this.showCurrency(country)})`}>
                    {getFieldDecorator('consumeMoney', {
                      rules: [
                        {required: true, message: '请输入实际支付金额!'}
                      ],
                    })(
                      <InputNumber style={{width: 130, marginLeft: 10}}
                                   min={0}
                                   max={999999.99}
                                   precision={2}
                                   placeholder="请输入消费金额"
                                   onChange={this.changeMoney.bind(this)}
                      />
                    )}
                  </FormItem>
                  <FormItem label={`原价(${this.showCurrency(country)})`}>
                    {getFieldDecorator('originalPrice', {
                      rules: [
                        {required: true, message: '请输入原价!'}
                      ],
                    })(
                      <InputNumber style={{width: 130, marginLeft: 10}}
                                   min={0}
                                   max={999999.99}
                                   precision={2}
                                   placeholder="请输入消费金额"
                                   onChange={this.changeMoney.bind(this)}
                      />
                    )}
                  </FormItem>
                  <FormItem label="返点金额(￥)">
                    {getFieldDecorator('reciptMoney', {
                      rules: [
                        {required: true, message: '请输入实际支付金额!'}
                      ],
                    })(
                      <InputNumber style={{width: 130, marginLeft: 10}}
                                   disabled={true}
                                   precision={2}
                      />
                    )}
                    {/*{getFieldValue('reciptAttribute') === 'SG'*/}
                    {/*&& <div className="subInfo"> (实际支付金额 * 汇率 * 返点率%)</div>}*/}
                    {/*{getFieldValue('reciptAttribute') === 'MG'*/}
                    {/*&& <div className="subInfo"> ((原价美金 * 返点率% - (原价美金 - 实际支付美金)) * 汇率)</div>}*/}
                  </FormItem>
                  <FormItem label={`返点金额(${this.showCurrency(country)})`}>
                    {getFieldDecorator('reciptDollar', {
                      rules: [
                        {required: true, message: '请输入实际支付金额!'}
                      ],
                    })(
                      <InputNumber style={{width: 130, marginLeft: 10}}
                                   disabled={true}
                                   precision={2}
                      />
                    )}
                    {/*{getFieldValue('reciptAttribute') === 'SG'*/}
                    {/*&& <div className="subInfo"> (实际支付金额 * 返点率%)</div>}*/}
                    {/*{getFieldValue('reciptAttribute') === 'MG'*/}
                    {/*&& <div className="subInfo"> (原价美金 * 返点率% - (原价美金 - 实际支付美金))</div>}*/}
                  </FormItem>
                  {country === '韩国' && getFieldValue('reciptAttribute') === 'SG' &&
                    <FormItem label="品牌折扣率">
                      {getFieldDecorator('discountRate', {
                        rules: [
                          {required: true, message: '请输入实际支付以及支付原价!'}
                        ],
                      })(
                        <InputNumber style={{width: 130, marginLeft: 10}}
                                     disabled={true}
                                     precision={2}
                        />
                      )}
                      <span> %</span>
                      <span className="subInfo"> (实际支付金额 / 原价)</span>
                    </FormItem>
                  }
                </div>
              }
            </Form>
          </div>
        }
        {(receiptTotal === 0 && !receiptLoading)
          && <div className="infoRed"
                  style={{marginLeft: 10}}
             >
            暂无小票
          </div>
        }
      </div>
    )
  }
}

export default AuditTicketModel;