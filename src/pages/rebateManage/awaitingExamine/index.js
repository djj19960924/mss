import React from 'react';
import {Button, DatePicker, Form, Icon, Input, InputNumber, message, Select, Radio, notification, Badge, Modal} from 'antd';
import moment from 'moment';
import ImageViewer from '@components/imageViewer/main';
import {inject, observer} from 'mobx-react/index';
import countryList from '@js/country';
import MoneyCalculation from './moneyCalculation/index';
import './index.less';

const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

// 正则小计(中文+韩文+英文+数字+()-_/\):
//
// new RegExp('^[\u4e00-\u9fa5]|[\uac00-\ud7a3]|[a-zA-Z0-9]|[\(\)\-\_\/]+$')
// 中文: [\u4e00-\u9fa5]
// (包括所有中文汉字,日文汉字,韩文汉字, 根据系统文字显示相应汉字字符样式)
// 韩文: [\uac00-\ud7a3]
// 日文: [\u3041-\u30ff]
// 中文括号(即（）): [\uff08\uff09]
// 正整数正则: /^[1-9]\d*$/

@inject('appStore') @observer @Form.create()
class awaitingExamine extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 图片查看器开关
      showImageViewer: false,
      // 选择的国家
      country: '',
      // 当前所选商场
      currentShop: undefined,
      // 是否有剩余的小票
      hasTicket: false,
      // 剩余小票列表
      ticketList: [],
      // 小票总数
      ticketTotal: 0,
      // 已完成小票数
      ticketDone: null,
      // 当前小票
      currentTicket: 0,
      // 品牌列表
      brandList: [],
      brandListOrigin: [],
      currentBrandList: [],
      // 子组件上传数据
      totalData: [],
      totalMoney: 0,
      totalClear: false,
      // 当前时间
      ticketDate: moment(new Date()).format('YYYY-MM-DD'),
      // 当前所选择小票
      currentTicketId: 0,
      // 返点金额
      reciptMoney: 0,
      // 驳回modal
      rejectVisible: false,
      // 驳回备注原因Id
      reasonId: null,
      //驳回选择其他,填写具体原因
      rejectSpecificReason: null,
      // 图片预览宽高自适应
      previewImageWH: 'width',
      // 默认汇率, 当以某一汇率提交成功小票以后
      // 会固定汇率选择框, 直到替换国家
      defaultExchangeRate: 1,
      // 自增变数, 用于获取页面刷新
      hasChange: 0,
      // 重复选择框
      repeatList: [],
      // 为空金额
      emptyList: [],
      // 选择商店相关
      // selectIsDisabled: true,
      selectIsLoading: false,
      // 小票加载
      ticketIsLoading: false,
    };
  }
  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    // this.getCountryLeftTicket()
    this.getMallListByNationName();
    this.getTicketList();
  }

  //渲染完成以后修正图片预览样式
  componentDidUpdate() {
    // 这里使用onload属性, 等待图片资源加载完成以后执行
    document.getElementsByClassName('previewImage')[0].onload = () => {
      let pI = document.getElementsByClassName('previewImage')[0];
      if ((pI.width / pI.height) < (400 / 550)) {
        this.setState({
          previewImageWH: 'height'
        })
      } else if ((pI.width / pI.height) >= (400 / 550)) {
        this.setState({
          previewImageWH: 'width'
        })
      }
    };
  }

  getMallListByNationName() {
    this.ajax.post('/mall/getMallListByNationName', {}).then(r => {
      const {status} = r.data;
      if (status === 10000) {
        const {data} = r.data, dataList = [];
        for (let i of data) {
          dataList.push(<Option key={i.mallName} country={i.nationName} value={`${i.mallId}${i.nationName}${i.mallName}`}>{i.nationName} - {i.mallId} - {i.mallName}</Option>);
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
    // console.log(val,option);
    // val即商场名, option.key即商场ID
    this.setState({
      currentShop: option.key,
      country: option.props.country
    },() => {
      this.getBrandListBymallName();
      // this.getTicketList();
    })
  }

  // 查询商场品牌列表
  getBrandListBymallName() {
    const {currentShop, ticketDate} = this.state;
    const data = {mallName: currentShop, createTime: ticketDate};
    this.ajax.post('/brand/getBrandListBymallName', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          brandListOrigin: data,
        });
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 根据商场名称获取小票接口
  getTicketList() {
    this.setState({ticketIsLoading: true});
    const {currentShop} = this.state;
    const data = {
      pageNum: 1,
      pageSize: 20,
      mallName: currentShop
    };
    this.ajax.post('/recipt/getReciptByMallName', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          ticketList: data.list,
          hasTicket: !!data.total,
          ticketTotal: data.total
        });
      } else if (r.data.status < 10000) {
        this.setState({
          ticketList: [],
          hasTicket: false,
          ticketTotal: 0
        });
      }
      this.setState({
        currentTicketId: 0,
        rejectVisible: false,
        reasonId: null,
        rejectSpecificReason: null,
        ticketIsLoading: false
      });
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 日期改变
  changeTicketDate(date) {
    this.setState({
      ticketDate: moment(date).format('YYYY-MM-DD')
    }, () => {
      this.getBrandListBymallName();
    });
  }

  // 修正返点金额
  changeReciptMoney(data = this.state.totalData, isAdd = false) {
    let totalMoney = 0, totalReciptMoney = 0, currentBrandList = [], totalClear = true;
    for (let n in data) {
      totalMoney += (!!data[n].totalMoney ? data[n].totalMoney : 0);
      totalReciptMoney += ((!!data[n].totalMoney && !!data[n].brandRebate) ?
        (data[n].totalMoney / 100 * data[n].brandRebate) : 0);
      currentBrandList.push(data[n].brand);
      if (!data[n].totalMoney && data[n].totalMoney !== 0) totalClear = false;
    }

    let exchangeRate = parseFloat(document.querySelector('#exchangeRate').value);
    // console.log(`返点金额为: ${ (!!totalReciptMoney && !!exchangeRate) ?
    //   parseFloat((totalReciptMoney * exchangeRate).toFixed(2)) : '0' }\n总金额为: ${totalMoney}`);
    this.setState({
      reciptMoney: ((!!totalReciptMoney && !!exchangeRate) ?
        parseFloat((totalReciptMoney * exchangeRate).toFixed(2))
        : '0'),
      totalMoney: totalMoney,
      totalData: data,
      currentBrandList: currentBrandList,
      totalClear: totalClear,
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
    } else if (val === '') {
      this.props.form.setFieldsValue({exchangeRate: 0});
      document.querySelector('#exchangeRate').value = 0;
    } else {
      callback('汇率最多可输入小数点后四位')
    }
  }

  // 日期选择器范围
  disabledDate(current) {
    return current && current > moment().endOf('day');
  }

  // 通过 - 提交表单
  handleSubmit() {
    const {country, totalClear, totalData, ticketList, currentShop, currentTicketId, totalMoney, reciptMoney} = this.state;
    this.props.form.validateFields((err, val) => {
      if (!err) {
        // 这里赋值, 同时判断品牌是否重复
        let dataList = [], repeatList = [];
        for (let n in totalData) {
          let ic = String(dataList.indexOf(totalData[n].brand));
          if (ic !== '-1') {
            if (repeatList.indexOf(ic) === -1) repeatList.push(ic);
            repeatList.push(n);
          }
          dataList.push(totalData[n].brand)
        }
        let data = {
          reciptId: ticketList[currentTicketId].reciptId,
          mallName: currentShop,
          teamNo: val.teamNo,
          consumeMoney: totalMoney,
          // 这里直接保存数组作为json字符串保存
          brandName: (totalData.length === 0 ? dataList[0] : JSON.stringify(dataList)),
          consumeDate: moment(val.ticketDate).format('YYYY-MM-DD'),
          exchangeRate: val.exchangeRate,
          // 数据库未保存, 扩展字段
          // rebateRate: val.rebateRate,
          reciptMoney: reciptMoney,
          unionId: ticketList[currentTicketId].unionId,
        };
        // country值为韩国时添加属性(业务逻辑)
        if (country === '韩国') data.reciptAttribute = val.reciptAttribute;
        if (val.exchangeRate === 0) {
          // 判断汇率不能为0
          message.error('汇率不能为零')
        } else if (!totalClear || totalMoney === null) {
          // 判断消费金额不能为空
          message.error('消费金额不能为空');
          let dataList = [];
          for (let m in totalData) if (!totalData[m].totalMoney) dataList.push(m);
          this.setState({emptyList: dataList})
        } else if (repeatList.length !== 0) {
          // 判断品牌是否重复
          message.error('品牌重复');
          this.setState({repeatList: repeatList});
        } else {
          this.ajax.post('/recipt/checkReciptAllow', data).then(r => {
            if (r.data.status === 10000) {
              message.success(r.data.msg);
              this.setState({defaultExchangeRate: val.exchangeRate});
              this.hasSubmit();
            }
            r.showError();
          }).catch(r => {
            console.error(r);
            this.ajax.isReturnLogin(r, this);
          });
        }
      }
    });
  }

  // 提交结束以后切换小票逻辑
  hasSubmit() {
    const {countryLeftTicket, country, ticketTotal, hasChange, ticketList, currentTicketId, defaultExchangeRate} = this.state;
    // 由于不可能每次操作都调取接口, 所以在实际调取审核/驳回接口成功的同时
    // 可以对本地数据进行同步改变, 使得角标以及商场剩余小票数量一直处于与服务器内部数据
    // 数值同步的状态, 虽然没有实时交互, 但也从本地计算的方式达到了类似的效果
    // countryLeftTicket[country] = countryLeftTicket[country] - 1;
    // let d = document.querySelector(`.brandLine.line_0`).querySelector('.noHandlerWrap');
    // d.style.border = '';
    this.setState({
      ticketTotal: (ticketTotal - 1),
      hasChange: (hasChange + 1),
      reciptMoney: 0,
      consumeMoney: 0,
      totalMoney: null,
      emptyList: [],
      repeatList: [],
      country: '',
      currentShop: undefined,
      brandListOrigin: []
    });
    // 重置表单
    this.props.form.resetFields();
    if (currentTicketId === (ticketList.length - 1)) {
      this.getTicketList(this);
      // this.getCountryLeftTicket();
    } else if (currentTicketId <= (ticketList.length - 1)) {
      this.setState({
        currentTicketId: currentTicketId + 1,
        // 清空驳回列表
        rejectVisible: false,
        reasonId: null,
        rejectSpecificReason: null
      });
    }
    // 将汇率修正为成功提交的数值
    this.props.form.setFieldsValue({
      exchangeRate: defaultExchangeRate
    });
  }

  //驳回备注确定
  openNotification() {
    const {reasonId, rejectSpecificReason, ticketList, currentTicketId} = this.state;
    if (reasonId !== null) {
      if (reasonId === 3 && rejectSpecificReason) {
        const reject = {
          reciptId: ticketList[currentTicketId].reciptId,
          note: reasonId + rejectSpecificReason
        };
        this.rejectMethod(reject);
      } else if (reasonId === 3 && !rejectSpecificReason) {
        message.warn("请填写具体原因")
      } else {
        const reject = {
          reciptId: ticketList[currentTicketId].reciptId,
          note: reasonId
        };
        this.rejectMethod(reject);
      }
    } else if (reasonId === null) {
      notification['warning']({
        message: '请选择驳回原因'
      });
    }
  }

  //驳回方法
  rejectMethod(data) {
    this.ajax.post('/recipt/checkReciptRejected', data).then(r => {
      if (r.data.status === 10000) {
        message.success(r.data.msg);
        this.hasSubmit();
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }

  render() {
    const {showImageViewer, shopList, currentShop, hasTicket, brandListOrigin, ticketList, currentTicketId, reciptMoney, defaultExchangeRate, previewImageWH, ticketTotal, country, ticketDate, hasChange, repeatList, emptyList, rejectVisible, reasonId, rejectSpecificReason, selectIsLoading, ticketIsLoading} = this.state;
    const {getFieldDecorator} = this.props.form;
    return (
      <div className="awaitingExamine">
        <div className="title">
          <div className="titleMain">小票审核</div>
          <div className="titleLine" />
        </div>
        <div className="leftTicketNum">当前剩余小票: {ticketTotal}</div>
        {!hasTicket && <div className="noTicket">
          {ticketIsLoading && <div><Icon type="loading" />小票加载中...</div>}
          {!ticketIsLoading && currentShop && <div><Icon type="smile" className="iconSmile"/><span>当前没有未审核的小票</span></div>}
        </div>}

        <div className="container" style={hasTicket ? {} : {display:'none'}}>
          {/*图片相关功能*/}
          <div className="containerBody containerImage">
            {/*单图片功能*/}
            <img className="previewImage"
                 src={!!ticketList.length ? ticketList[currentTicketId].pictureUrl : ''}
                 alt=""
              // 打开图片弹窗
                 onClick={() => {
                   this.setState({showImageViewer: true})
                 }}
                 style={{
                   width: previewImageWH === 'width' ? '100%' : 'auto',
                   height: previewImageWH === 'height' ? '100%' : 'auto',
                 }}
            />
          </div>

          {/*表单功能*/}
          <div className="containerBody containerForm">
            <Form className="examineForm"
                  id='myForm'
            >
              <FormItem label="商场"
                        colon
                        labelCol={{span: 2}}
              >
                {getFieldDecorator('selectShops', {
                  rules: [
                    {required: true, message: '请选择商场!'}
                  ],
                })(
                  <Select className="selectShops"
                          style={{width: 200, marginLeft: 10}}
                          placeholder={selectIsLoading ? "加载中请稍后..." : "请选择商场"}
                          // value={currentShop}
                          onChange={this.selectShop.bind(this)}
                          showSearch
                          loading={selectIsLoading}
                          dropdownMatchSelectWidth={false}
                  >
                    {shopList}
                  </Select>
                )}
                <span style={{color: 'rgba(255,0,0,.5)',marginLeft: 10}}>可输入商场名或商场id进行查询</span>
              </FormItem>

              <FormItem label="请输入凭证号"
                        colon
                        labelCol={{span: 6}}
                        wrapperCol={{span: 12}}
              >
                {getFieldDecorator('teamNo', {
                  initialValue: '',
                  rules: [
                    {required: true, message: '请输入凭证号!'}
                  ],
                })(
                  <Input style={{width: 180, marginLeft: 10, color: '#555'}}
                         placeholder="请输入凭证号"
                  />
                )}
              </FormItem>

              <FormItem label="小票购买时间"
                        colon
                        labelCol={{span: 6}}
                        wrapperCol={{span: 5}}
              >
                {getFieldDecorator('ticketDate', {
                  rules: [{required: true}],
                  initialValue: moment(new Date())
                })(
                  <DatePicker style={{width: 130, marginLeft: 10}}
                              dropdownClassName="datePickerPopup"
                              allowClear={false}
                              disabledDate={this.disabledDate}
                              onChange={this.changeTicketDate.bind(this)}
                  />
                )}
              </FormItem>

              <MoneyCalculation brandListOrigin={brandListOrigin}
                                ticketDate={ticketDate}
                                country={country}
                                currentShop={currentShop}
                                changeReciptMoney={this.changeReciptMoney.bind(this)}
                                hasChange={hasChange}
                                repeatList={repeatList}
                                emptyList={emptyList}
              />

              {/* 韩国专有属性 */}
              {country === '韩国' && <FormItem label="属性"
                                             colon
                                             labelCol={{span: 2}}
              >
                {getFieldDecorator('reciptAttribute', {
                  rules: [{required: true}],
                  initialValue: 'SG'
                })(
                  <Select style={{width: 100, marginLeft: 10}}
                  >
                    <Option key="SG">SG</Option>
                    <Option key="MG">MG</Option>
                  </Select>
                )}
              </FormItem>}

              <FormItem label="汇率"
                        colon
                        labelCol={{span: 2}}
                        wrapperCol={{span: 20}}
              >
                {getFieldDecorator('exchangeRate', {
                  rules: [
                    {required: true},
                    {validator: this.exchangeRateValidator.bind(this)}
                  ],
                  initialValue: defaultExchangeRate
                })(
                  <InputNumber style={{width: 100, marginLeft: 10}}
                         id="exchangeRate"
                         placeholder="请输入汇率"
                    // 修正汇率触发
                         onChange={() => this.changeReciptMoney()}
                  />
                )}
              </FormItem>

              {/* 显示返点金额 */}
              <p>
                <span style={{marginLeft: 10, color: '#999'}}>返点金额(¥)：{reciptMoney}</span>
              </p>
            </Form>

            <div>
              <Button type="primary"
                      htmlType="submit"
                      className="examineFormButton"
                      style={{marginTop: '15px', marginLeft: '10px'}}
                      onClick={this.allow(101) ? this.handleSubmit.bind(this) : null}
                      disabled={!this.allow(101)}
                      title={!this.allow(101) ? '没有该操作权限' : null}
              >通过</Button>
              <Button type="danger"
                      // 打开驳回原因窗口
                      onClick={() => {
                        if (this.allow(102)) this.setState({rejectVisible: true,})
                      }}
                      style={{marginLeft: '20px'}}
                      disabled={!this.allow(102)}
                      title={!this.allow(102) ? '没有该操作权限' : null}
              >驳回</Button>
            </div>
          </div>
        </div>

        {/* 驳回相关模块 */}
        <Modal visible={rejectVisible}
               centered
               closable={false}
               width={300}
               title="请选择驳回原因"
               wrapClassName="ticketRejectModal"
               onOk={
                 this.openNotification.bind(this)
               }
               onCancel={() => {
                 this.setState({
                   rejectVisible: false,
                   rejectSpecificReason: null,
                   reasonId: null
                 });
               }}>
          <RadioGroup className='allReasons'
                      onChange={(e) => {
                        this.setState({reasonId: e.target.value});
                        if(e.target.value!==3){
                          this.setState({rejectSpecificReason: null})
                        }
                      }}
                      value={reasonId}
          >
            <Radio value={0}>小票不清晰</Radio>
            <Radio value={1}>凭证号不正确</Radio>
            <Radio value={2}>小票重复</Radio>
            <Radio value={4}>小票不完整</Radio>
            <Radio value={3}>其他</Radio>
          </RadioGroup>
          <Input.TextArea placeholder="请输入具体原因" autosize={true} disabled={reasonId !== 3} value={rejectSpecificReason}
                          onChange={(e) => {
                            this.setState({rejectSpecificReason: e.target.value})
                          }}/>
        </Modal>
        {/* 图片查看弹窗组件 */}
        {showImageViewer &&
        <ImageViewer // 图片链接, 上为图片查看器开关
          imgSrc={!!ticketList.length ? ticketList[currentTicketId].pictureUrl : ''}
          // 关闭图片查看
          closeImageViewer={() => this.setState({showImageViewer: false,})}
          option={{
            // 添加图片拖拽功能
            move: true,
            // 添加图片旋转功能
            rotate: true,
            // 添加鼠标滚轮放大缩小功能
            zoom: true,
            // 添加遮罩层, 点击遮罩层可以关闭图片预览
            shadow: false,
          }}
        />}
      </div>
    );
  }
}

export default awaitingExamine;