import React from 'react';
import {withRouter} from 'react-router-dom';
import {Form, Select, Input, InputNumber, Button, Spin, Icon, message} from 'antd';
import debounce from 'lodash/debounce';
import {inject, observer} from 'mobx-react/index';
import './index.less';

@withRouter @inject('appStore') @observer @Form.create()
class costCalculationModel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 自营/客户类型 1:自营,0:客户
      checkChoice: 1,
      // 剩余小票张数
      receiptTotal: 0,
      // 折扣率
      discountRate: 100,
      // 返点率
      rebateRate: 0,
      // 商品数量
      productsNumber: 1,
      // 商品列表
      productCosts: [
        {
          // 商品名称
          productName: '',
          // 商品单价
          unitPrice: undefined,
          // 商品数量
          number: undefined,
          // 成本
          cost: undefined,
          // 商品id
          productId: undefined
        }
      ],
      // 商品搜索下拉框 options 存放
      productInfoList: [],
      // 当日韩汇率
      koreaRate: undefined,
      // 当日美汇率
      americaRate: undefined,
      // 默认为韩国, 仅用于展示成本计算模块
      country: '韩国',
      // 新增商品输入字段
      name: '',
      addNameLoading: false
    };
  }
  // 传递成本计算值
  changeCostInfo = this.props.changeCostInfo;

  componentDidMount() {
    // 注册至父级页面
    const {onRef} = this.props;
    onRef(this);
  }

  // 增加商品
  addProduct() {
    const {productCosts} = this.state;
    productCosts.push({
      // 商品名称
      productName: '',
      // 商品单价
      unitPrice: undefined,
      // 商品数量
      number: undefined,
      // 成本
      cost: undefined,
      // 商品id
      productId: undefined
    });
    this.setState({});
  }

  // 删除某一商品
  deleteProduct(index) {
    const {productCosts} = this.state;
    this.changeCost(index);
    productCosts.splice(index,1);
    this.setState({});
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {productCosts} = this.state;
    const {checkChoice, receiptTotal, discountRate, rebateRate, country} = this.props;
    // 当切换小票逻辑时触发(自营/客户)
    if (prevProps.checkChoice !== checkChoice) this.setState({checkChoice});
    // 当小票数量变更时触发
    if (prevProps.receiptTotal !== receiptTotal) this.setState({receiptTotal});
    // 改变国家时触发
    if (prevProps.country !== country) this.setState({country});
    // 折扣率改变时触发 || 返点率改变时触发
    if (prevProps.discountRate !== discountRate || prevProps.rebateRate !== rebateRate) {
      this.setState({discountRate, rebateRate},()=>{
        for (let num in productCosts) {
          this.changeCost(num);
        }
      });
    }
  }

  // 改变成本表
  changeProductCosts(e, index, type, isNumber) {
    const {productCosts} = this.state;
    // isNaN 如非数值, 强制转为数值判断是否为数字, 而 Input 的 value 为对象
    // InputNumber 的值恒定为数字, 所以使用简单的方法判断 是否为 InputNumber 的值
    this.changeCost(index);
    // 待判断e是否为数字
    productCosts[index][type] = isNumber ? (e) : e.target.value;
    this.setState({})
  }

  // 改变成本
  changeCost(index) {
    const {productCosts, discountRate, rebateRate, koreaRate, americaRate} = this.state;
    productCosts[index].cost = productCosts[index].unitPrice ?
      productCosts[index].unitPrice * (discountRate / 100) * ((100 - rebateRate) / 100) : 0;
    this.setState({},()=>{
      this.changeCostInfo({productCosts, koreaRate, americaRate});
    });
  }

  // 搜索商品依赖
  lastPostId = 0;
  // 防抖插件
  ajaxPost = debounce(this.getProductList, 800);

  // 模糊查询商品
  getProductList(index, name) {
    // console.log(index, name)
    const {Option} = Select;
    const {productInfoList} = this.state;
    name = name.trim();
    if (!!name) {
      const data = {name};
      this.lastPostId += 1;
      const postId = this.lastPostId;
      productInfoList[index] = {options: [], optionsOrigin: [], loading: true};
      this.setState({});
      this.ajax.post('/backend/productCost/getProductList', data).then(r => {
        const {status, data} = r.data;
        if (status === 10000) {
          if (postId !== this.lastPostId) {
            // for fetch callback order
            return;
          }
          const objectData = {options: [], optionsOrigin: [], loading: true};
          if (data.length > 0) {
            objectData.optionsOrigin = data;
            if (data.length < 100) {
              for (let obj of data) {
                objectData.options.push(
                  <Option key={obj.id} value={obj.name} id={obj.id} name={obj.name}>
                    {obj.name}
                  </Option>
                );
              }
            } else {
              console.log(data.length);
              message.warn('商品搜索结果过多, 请精确搜索')
            }
            productInfoList[index] = objectData;
            this.setState({})
          }
        }
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    }
  }

  // 改变商品选择时触发
  changeProduct(index, name, option) {
    const {productCosts} = this.state;
    productCosts[index].productName = name;
    productCosts[index].productId = option.props.id;
    this.setState({})
  }

  // 展示搜索框空闲状态
  isLoading(index) {
    const {productInfoList} = this.state;
    if (!productInfoList[index]) {
      return '尚未搜索商品'
    } else {
      if (productInfoList[index].loading) {
        return <div><Spin /> 正在搜索中...</div>
      } else {
        if (productInfoList[index].optionsOrigin.length > 0) {
          return '当前搜索结果过多, 请输入具体名称'
        } else {
          return '未找到符合的商品'
        }
      }
    }
  }

  // 快捷新增商品
  insertIncompleteProduct() {
    const {name} = this.state;
    const showLoading = Is => this.setState({addNameLoading: Is});
    showLoading(true);
    const data = {name};
    this.ajax.post('/backend/productCost/insertIncompleteProduct', data).then(r => {
      const {status, msg} = r.data;
      if (status === 10000) {
        message.success(`${msg}, 商品名为: ${name}`);
        this.setState({name: ''})
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  componentWillUnmount() {this.setState = () => null}
  render() {
    const FormItem = Form.Item;
    const {checkChoice, receiptTotal, productCosts, koreaRate, americaRate, country, productInfoList, name, addNameLoading} = this.state;
    return (
      <div className="costCalculationModel">
        {/* 1.满足自营小票 2.满足存在剩余小票 */}
        {checkChoice === 1 && receiptTotal > 0 && country === '韩国' &&
          <div>
            <div className="title">-- 成本计算模块 --</div>
            <Form>
              {
                // <FormItem label="当日韩元汇率"
                //         validateStatus={!!koreaRate ? '' : 'error'}
                //         required
                // >
                //   <InputNumber value={koreaRate}
                //               onChange={value => this.setState({koreaRate: value})}
                //   />
                // </FormItem>
                // <FormItem label="当日美元汇率"
                //           validateStatus={!!americaRate ? '' : 'error'}
                //           required
                // >
                //   <InputNumber value={americaRate}
                //               onChange={value => this.setState({americaRate: value})}
                //   />
                // </FormItem>
              }
              <FormItem label="快捷新增商品">
                <Input style={{width: 200}}
                       value={name}
                       placeholder="请输入商品名称"
                       onChange={e => this.setState({name: e.target.value})}
                />
                <Button style={{marginLeft: 10}}
                        onClick={this.insertIncompleteProduct.bind(this)}
                        loading={addNameLoading}
                >新增</Button>
              </FormItem>
              {productCosts.map((item,index) => {
                return <div key={index}>
                  <div className="productTitle">-- 商品{index + 1} --</div>
                  <FormItem label="商品选择">
                    <Select placeholder="输入商品名称搜索商品"
                            style={{width: 200}}
                            // value={}
                            dropdownMatchSelectWidth={false}
                            // 数据为空时显示
                            notFoundContent={this.isLoading(index)}
                            // 下拉箭头
                            showArrow={false}
                            // 筛选结果
                            filterOption={false}
                            // 搜索
                            showSearch
                            onSearch={this.ajaxPost.bind(this, index)}
                            onChange={this.changeProduct.bind(this, index)}
                    >
                      {productInfoList[index] ? productInfoList[index].options : []}
                    </Select>
                  </FormItem>
                  <FormItem label="商品名称"
                            validateStatus={!!productCosts[index].productName ? '' : 'error'}
                            required
                  >
                    <Input value={productCosts[index].productName}
                           disabled
                    />
                  </FormItem>
                  <FormItem label="商品id"
                            validateStatus={!!productCosts[index].productId ? '' : 'error'}
                            required
                  >
                    <Input value={productCosts[index].productId}
                           disabled
                    />
                  </FormItem>
                  <FormItem label="单价"
                            validateStatus={!!productCosts[index].unitPrice ? '' : 'error'}
                            required
                  >
                    <InputNumber value={productCosts[index].unitPrice}
                                 min={0}
                                 max={999999.99}
                                 precision={2}
                                 onChange={e => {
                                   this.changeProductCosts(e, index, 'unitPrice', true)
                                 }}
                    />
                  </FormItem>
                  <FormItem label="数量"
                            validateStatus={!!productCosts[index].number ? '' : 'error'}
                            required
                  >
                    <InputNumber value={productCosts[index].number}
                                 min={0}
                                 max={999999}
                                 precision={0}
                                 onChange={e => {
                                   this.changeProductCosts(e, index, 'number', true)
                                 }}
                    />
                  </FormItem>
                  <FormItem label="成本"
                            validateStatus={!!productCosts[index].cost ? '' : 'error'}
                            required
                  >
                    <InputNumber value={productCosts[index].cost}
                                 precision={2}
                                 disabled
                    />
                    <Button type="danger"
                            onClick={this.deleteProduct.bind(this, index)}
                            disabled={productCosts.length === 1}
                            style={{marginLeft: 10}}
                    >删除该商品</Button>
                  </FormItem>
                </div>
              })}
            </Form>
            <div className="btnLine">
              <Button onClick={this.addProduct.bind(this)}
                      type="primary"
                      style={{marginLeft: 10}}
              ><Icon type="plus" />增加商品</Button>
            </div>
          </div>
        }
      </div>
    )
  }
}

export default costCalculationModel;