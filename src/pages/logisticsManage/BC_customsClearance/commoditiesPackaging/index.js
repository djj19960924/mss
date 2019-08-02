import React from 'react';
import { message, Icon, Button, Row, Col, InputNumber, Modal, } from 'antd';
import allowedKeys from "@js/allowedKeys";
import {inject, observer} from 'mobx-react/index';

import './index.less';
@inject('appStore') @observer
class commoditiesPackaging extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      // 判断页面是否为激活状态, 当 window 失去焦点时, 页面进入待机遮罩状态
      isFocusOnWindow: true,
      // 加载显示
      loadingShow: false,
      unionId: null,
      nickname: null,
      // 用户下箱子以及商品信息
      boxesList: [],
      // 当前所选箱号
      selectBox: ``,
      // 当前所编辑的箱子重量缓存
      currentBoxWeight: null,
      // 是否选中了某一个输入框
      isOnFocusInput: false,
      // 是否在加载状态中
      boxesIsLoading: false,
      // 校验信息
      orderMoney: 0,
      productNum: 0,
      // 展示支付二维码弹窗
      showPayQRCode: false,
      // 二维码数据存放
      elementQRCode: null,
      // 有未支付订单
      needToPay: false,
      // 线下支付按钮loading
      offLinePayLoading: false,
      proprietaryLoading: false
    };
    window.test = this;
  }
  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    let unionId = null,nickname =null;
    if (window.getCookie('unionId') !== null) {
      unionId = window.getCookie('unionId');
      nickname = window.getCookie('nickname');
    } else if (window.getQueryString('unionId') !== null) {
      unionId = window.getQueryString('unionId');
      nickname = window.getQueryString('nickname');
      window.setCookie('unionId',unionId,7200);
      window.setCookie('nickname',nickname,7200);
    } else {
      message.warn(`请用户登录`);
      this.props.history.push(`/logistics-manage/BC-customsClearance/commodities-packaging/customer-login`);
      return false
    }
    this.setState({unionId:unionId,nickname:nickname},()=>{
      this.getParcelProductListByUnionId();
    });
    // this.loadKeyListener();

    message.config({duration:4,maxCount:3});
    window.onblur = () => {
      // console.log(`失去焦点!`);
      this.setState({isFocusOnWindow: true})
    };
  }

  // 根据unionId获取用户信息
  getParcelProductListByUnionId() {
    this.loadKeyListener();
    const { selectBox, unionId, boxesIsLoading, } = this.state;
    if (!boxesIsLoading) {
      const showLoading = Is => this.setState({boxesIsLoading: Is});
      showLoading(true);
      const data = {unionId};
      this.ajax.post('/parcelManagement/getParcelProductListByUnionId', data).then(r => {
        const {status, data} = r.data;
        if (status === 10000) {
          // 成功查到已录入, 并且未生成订单的箱号
          this.setState({boxesList: data, selectBox: selectBox === '' ? data[0].parcelNo : selectBox})
        } else if (status === 9998) {
          // 查询到用户没有未支付订单, 并且没有录入箱号
          this.setState({boxesList: [],selectBox: '', needToPay: false});
        } else if (status === 9999) {
          // 查询到用户存在未支付订单, 跳转进入支付页面
          this.setState({boxesList: [], selectBox: '', needToPay: true}, () => {
            this.createQRCode(document.querySelector(`#showQRCode`));
            this.unloadKeyListener();
          });
        } else {
          // 报错, 清除显示区域
          this.setState({boxesList: [],selectBox: ''})
        }
        r.showError();
        showLoading(false);
      }).catch(r => {
        console.error(r);
        showLoading(false);
        this.ajax.isReturnLogin(r, this);
      });
    } else {
      message.error(`操作过快, 请稍后再试`)
    }
  }

  // 强弹框报错
  showWarningModal(text) {
    Modal.warning({
      title: '警告',
      content: text,
    })
  }

  // 增加箱子
  generateParcel(parcelNo) {
    const { unionId, nickname, boxesIsLoading, } = this.state;
    if (!boxesIsLoading) {
      const showLoading = Is => this.setState({boxesIsLoading: Is});
      showLoading(true);
      const data = {parcelNo, unionId, wechatName: nickname};
      this.ajax.post('/parcelManagement/generateParcel', data).then(r => {
        const {status, data, msg} = r.data;
        if (status === 10000) {
          this.setState({boxesList: data, selectBox: data[`${data.length - 1}`].parcelNo}, () => {
            window.location.hash = `box_${data.length - 1}`
          });
          // message.success(msg)
        }
        this.calcAll();
        r.showError();
        showLoading(false);
      }).catch(r => {
        console.error(r);
        showLoading(false);
        this.ajax.isReturnLogin(r, this);
      });
    } else {
      message.error(`操作过快, 请稍后再试`)
    }
  }

  // 增加/减少 箱内指定商品数量
  changeProductNumber(type,productCode,parcelNo) {
    // console.log(parcelNo);
    const { boxesList, boxesIsLoading, } = this.state;
    if (!boxesIsLoading) {
      let interfaceUrl = `/productManagement/`;
      if (type === 'plus') interfaceUrl += `increaseProductNumber`;
      else if (type === 'minus') interfaceUrl += `decreaseProductNumber`;
      const showLoading = Is => this.setState({boxesIsLoading: Is});
      showLoading(true);
      const data = {parcelNo, productCode};
      this.ajax.post(`${interfaceUrl}`, data).then(r => {
        const {status, data, msg} = r.data;
        if (status === 10000) {
          for (let n in boxesList) if (boxesList[n].parcelNo === parcelNo) {
            let dataList = boxesList;
            dataList[n].parcelProductVoList = data;
            this.setState({boxesList: dataList})
          }
          message.success(`${type === 'plus' ? '增加' : '减少'}商品数量成功`)
        } else if (status < 10000) {
          message.warn(`${msg} 状态码:${status}`)
        } else if (status > 10000) {
          if (status === 10002) {
            // 单独提示 货值超过2000
            this.showWarningModal(msg);
          } else {
            message.error(`${msg} 状态码:${status}`)
          }
        }
        this.calcAll();
        // 这里托管系统报错
        // r.showError();
        showLoading(false);
      }).catch(r => {
        console.error(r);
        showLoading(false);
        this.ajax.isReturnLogin(r, this);
      });
    } else {
      message.error(`操作过快, 请稍后再试`)
    }
  }

  // 商品录入
  entryProductInfo(productCode) {
    const { selectBox, unionId, nickname, boxesList, boxesIsLoading, } = this.state;
    if (!boxesIsLoading) {
      if (selectBox) {
        const showLoading = Is => this.setState({boxesIsLoading: Is});
        showLoading(true);
        const data = {
          parcelNo: selectBox,
          productCode,
          unionId,
          wechatName: nickname,
        };
        this.ajax.post('/productManagement/entryProductInfo', data).then(r => {
          const {status, data, msg} = r.data;
          if (status === 10000) {
            for (let n in boxesList) if (boxesList[n].parcelNo === selectBox) {
              const dataList = boxesList;
              dataList[n].parcelProductVoList = data;
              this.setState({boxesList: dataList});
              message.success(`商品已成功录入 ${parseInt(n) + 1}号箱`, 5)
            }
          } else if (status < 10000) {
            if (status === 9999) {
              message.warn(`扫码失败或商品未备案, 请尝试重新扫描该条码`)
            } else {
              message.warn(`${msg}`)
            }
          } else if (status > 10000) {
            if (status === 10002) {
              this.showWarningModal(msg);
            } else {
              message.error(`${msg} 状态码:${status}`);
            }
          }
          // 这里托管系统报错
          // r.showError();
          showLoading(false);
        }).catch(r => {
          console.error(r);
          showLoading(false);
          this.ajax.isReturnLogin(r, this);
        });
      } else {
        message.warn('请先扫描箱号面单, 录入箱子')
      }
    } else {
      message.error(`操作过快, 请稍后再试`)
    }
  }

  // 用于卸载扫码器扫码功能
  unloadKeyListener() {
    window.onkeyup=window.onkeydown=null;
  }

  // 用于读取并处理扫码器扫取内容
  loadKeyListener() {
    // 加载监听器时, 建议先将监听部分内容清空
    this.unloadKeyListener();
    let lastInputTime = null, inputValue = ``;
    let doTimeOut = null;
    const ruleBox = /^BH+/;
    const showLoading = Is => this.setState({loadingShow: Is});
    window.onkeydown = e => {
      if (allowedKeys.includes(e.key) || e.key === `Enter`) {
        // console.log(`按键值:"${e.key}", 按键时间:${new Date().getTime()}`);
        // onKeyDownTime = new Date().getTime();
        // 这里添加 timeout 说明:
        // 每次按键结束以后都会设置一个清除 inputValue 的 setTimeout
        // 目的为了防止 非短时间输入(扫码器扫码)进入识别状态
        // 当输入速度小于 50 毫秒时, 会清除上一个 setTimeout
        // 直到最终输入值为 Enter 时, 开始结算内容, 判断字符串并进行对应的操作
        clearTimeout(doTimeOut);
        if (e.key !== `Enter`) inputValue += e.key;
        lastInputTime = new Date().getTime();
        doTimeOut = setTimeout(() => {
          // console.log(inputValue);
          showLoading(false);
          // 当文字少于 5 时不予提示, 防止用户按到键盘产生误报
          if (inputValue.length > 5 && e.key !== `Enter`) {
            message.error('扫码识别失败, 请重新扫描');
          }
          inputValue = ``;
          lastInputTime = null;
        }, 50);
        if (e.key === `Enter`) {
          document.activeElement.blur();
          console.log(inputValue);
          // 初步通过箱号校验
          if (ruleBox.test(inputValue)) {
            if (inputValue.length === 14) {
              // message.success(`识别为箱号: ${inputValue}`);
              // 判断是否已有该箱子
              let hasThisBox = false,boxNum = null;
              const { boxesList, } = this.state;
              for (let n in boxesList) if (boxesList[n].parcelNo === inputValue) {
                hasThisBox = true;
                boxNum = n;
              }
              if (hasThisBox) {
                this.setState({selectBox:inputValue},()=>{
                  window.location.hash = `box_${boxNum}`;
                  message.success(`选中 ${parseInt(boxNum)+1}号箱 箱号为:${inputValue}`)
                })
              } else if (!hasThisBox) this.generateParcel(inputValue);
            } else {
              message.error(`识别为箱号, 但是长度不正确, 请重新扫描`);
            }
          } else {
            // 商品条码判断, 调取接口添加商品进当前箱子
            // message.success(`识别为条形码: ${inputValue}`);
            if (inputValue) {
              this.entryProductInfo(inputValue);
            } else {
              message.error('条码扫描失败, 请重试')
            }
          }
        }
      }
    };
    window.onkeyup = e => {
      // 这里判断如果起键与上一次按键时间相隔小于 50 毫秒, 则开启 loading, 认为已成功扫码
      if (new Date().getTime() - lastInputTime < 50) {
        // console.warn(`按键值:"${e.key}", 起键时间:${new Date().getTime()}`);
        // console.log(inputValue);
        showLoading(true);
      }
    };
  }

  // 改变箱重
  onChangeBoxWeight(Num,parcelNo,value) {
    const { boxesList, } = this.state;
    let dataList = boxesList;
    dataList[Num].parcelWeight = value;
    this.setState({boxesList: dataList})
  }

  // 焦点进入箱重输入框触发
  onFocusBoxWeight(Num,parcelNo) {
    const { boxesList, } = this.state;
    this.setState({isOnFocusInput: true,selectBox: parcelNo,currentBoxWeight: boxesList[Num].parcelWeight});
    this.unloadKeyListener();
    window.onkeyup = (e) => {
      if (e.key === `Enter`) document.querySelector(`#boxWeight_${Num}`).blur();
    }
  }

  // 离开箱重输入框触发
  onBlurBoxWeight(Num,parcelNo) {
    const { currentBoxWeight, boxesList, } = this.state;
    if (currentBoxWeight !== boxesList[Num].parcelWeight) this.saveParcelFreight(Num,parcelNo,currentBoxWeight);
    this.loadKeyListener();
    this.setState({isOnFocusInput: false});
  }

  // 更改箱重, 保存运费
  saveParcelFreight(Num,parcelNo,currentBoxWeight) {
    const { boxesList, boxesIsLoading, } = this.state;
    if (!boxesIsLoading) {
      let dataList = boxesList;
      let resetWeight = () => {
        dataList[Num].parcelWeight = currentBoxWeight;
        this.setState({boxesList:dataList});
      };
      if (!!boxesList[Num].parcelWeight) {
        const showLoading = Is => this.setState({boxesIsLoading: Is});
        showLoading(true);
        const data = {parcelWeight: boxesList[Num].parcelWeight, parcelNo};
        this.ajax.post('/parcelManagement/saveParcelFreight', data).then(r => {
          const {status, data} = r.data;
          if (status === 10000) {
            // 这里提示进行变更
            message.success(`${Num+1}号箱 重量更新成功`);
          } else {
            resetWeight();
          }
          r.showError();
          this.calcAll();
          showLoading(false);
        }).catch(r => {
          console.error(r);
          showLoading(false);
          this.ajax.isReturnLogin(r, this);
        });
      } else {
        message.error(`重量不能为空`);
        resetWeight();
      }
    } else {
      message.error(`操作过快, 请稍后再试`)
    }
  }

  // 退出当前用户
  loginOut() {
    window.delCookie('unionId');
    window.delCookie('nickname');
    this.props.history.push(`/logistics-manage/BC-customsClearance/commodities-packaging/customer-login`);
  }

  componentWillUnmount() {
    // 组件关闭以后, 卸载window事件
    window.onkeyup = window.onkeydown = window.onblur = window.onfocus = null;
    // 卸载异步操作设置状态
    this.setState = () => null
  }

  // 计算方法
  calcAll() {
    this.calcProductNumber();
    this.calcOrderMoney();
  }

  // 计算商品总数方法
  calcProductNumber() {
    const { boxesList, productNum, } = this.state;
    let Num = 0;
    for (let i of boxesList) {
      if (!!i.parcelProductVoList) for (let bI of i.parcelProductVoList) {
        Num += bI.productNum;
      }
    }
    if (productNum !== Num) this.setState({productNum:Num});
  }

  // 计算本次合计价格
  calcOrderMoney() {
    const { boxesList, orderMoney, } = this.state;
    let totalPrice = 0;
    let priceRule = (weight) => {
      let price = 0;
      let W = Math.ceil(weight);
      if (W < 5) {
        price += (60*W)
      } else if (W >= 5 && W <= 7) {
        price += (60*W)
      } else if (W > 7) {
        price += (50*W)
      }
      return price;
    };
    for (let i of boxesList) {
      totalPrice += priceRule(i.parcelWeight);
    }
    if (orderMoney !== totalPrice) this.setState({orderMoney: totalPrice});
  }

  // 支付
  createOrder() {
    const { boxesList, } = this.state;
    // 判断重量
    let allWeightDone = true;
    for (let n in boxesList) {
      if (!boxesList[n].parcelWeight) {
        allWeightDone = false;
        message.error(`箱子重量不能为空 ${parseInt(n)+1}号箱 重量为空`)
      }
    }
    if (allWeightDone) if (boxesList.length > 0) {
      this.generateParcelOrder();
    } else {
      message.error(`箱子不能为空`)
    }
  }

  // 删除箱子接口
  deleteParcelByParcelNo(parcelNo, Num) {
    const {boxesList} = this.state;
    const showLoading = Is => this.setState({boxesIsLoading: Is});
    showLoading(true);
    const data = {parcelNo};
    this.ajax.post('/parcelManagement/deleteParcelByParcelNo', data).then(r => {
      const {status, data} = r.data;
      if (status === 10000) {
        const dataList = boxesList;
        dataList.splice(Num, 1);
        this.setState({
          boxesList: dataList,
          // 恢复箱子选择
          selectBox: dataList.length === 0 ? '' : dataList[dataList.length - 1].parcelNo
        });
      }
      r.showError();
      showLoading(false);
      this.calcAll();
    }).catch(r => {
      console.error(r);
      showLoading(false);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 保存订单
  generateParcelOrder() {
    const { boxesList, boxesIsLoading, unionId, nickname, orderMoney, productNum, } = this.state;
    if (!boxesIsLoading) {
      const parcelNoList = [];
      for (let i of boxesList) {
        parcelNoList.push(i.parcelNo)
      }
      const showLoading = Is => this.setState({boxesIsLoading: Is});
      showLoading(true);
      const data = {
        parcelNoList, unionId, productNum,
        wechatName: nickname,
        orderMoney: orderMoney.toFixed(2),
        parcelNum: boxesList.length,
        logisticsChoice: 2
      };
      this.ajax.post('/OrderManagement/generateParcelOrder', data).then(r => {
        const {status, data} = r.data;
        if (status === 10000) {
          this.getParcelProductListByUnionId();
          this.setState({showPayQRCode: true},()=>{
            this.createQRCode(document.querySelector(`#payQRCodeShow`));
          });
        }
        r.showError();
        showLoading(false);
      }).catch(r => {
        console.error(r);
        showLoading(false);
        this.ajax.isReturnLogin(r, this);
      });
    } else {
      message.error(`操作过快, 请稍后再试`)
    }
  }

  // 线下支付
  offLinePay() {
    const {offLinePayLoading, unionId} = this.state;
    const offLinePayParcelOrder = () => {
      const showLoading = Is => this.setState({offLinePayLoading: Is});
      showLoading(true);
      // BC线下支付
      const data = {unionId};
      this.ajax.post('/parcelManagement/offLinePayParcelOrder', data).then(r => {
        const {status, msg} = r.data;
        if (status === 10000) {
          message.success(msg);
          this.setState({showPayQRCode: false}, () => {
            this.getParcelProductListByUnionId();
          });
        }
        showLoading(false);
        r.showError();
      }).catch(r => {
        showLoading(false);
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    };
    // 打开新确认弹窗
    Modal.confirm({
      title: '线下支付',
      okButtonProps: {
        loading: offLinePayLoading
      },
      onOk: offLinePayParcelOrder,
      content: <div>
        确认是否线下支付?
      </div>
    })
  }

  // BC自营包裹
  payByProprietary() {
    const {proprietaryLoading, unionId} = this.state;
    const proprietaryPass = () => {
      const showLoading = Is => this.setState({proprietaryLoading: Is});
      showLoading(true);
      // BC线下支付
      const data = {unionId};
      this.ajax.post('/OrderManagement/payByProprietary', data).then(r => {
        const {status, msg} = r.data;
        if (status === 10000) {
          message.success(msg);
          this.setState({showPayQRCode: false}, () => {
            this.getParcelProductListByUnionId();
          });
        }
        showLoading(false);
        r.showError();
      }).catch(r => {
        showLoading(false);
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    };
    // 打开新确认弹窗
    Modal.confirm({
      title: '通过自营包裹',
      okButtonProps: {
        loading: proprietaryLoading
      },
      onOk: proprietaryPass,
      content: <div>
        确认是否通过自营包裹?
      </div>
    })
  }

  // 生成二维码
  createQRCode(Obj) {
    Obj.innerHTML = '';
    let isTest = false;
    if (window.isServerTest) isTest = true;
    if (window.isLocalTest) isTest = true;
    let qrcode = new window.QRCode(Obj, {
      text: `http://api.maishoumiji.com/wechat/authorize?returnUrl=http%3A%2F%2F${isTest ? 'test' : ''}m.maishoumiji.com/%23/paymenttransfer`,
      width: 200,
      height: 200,
      colorDark : "#000",
      colorLight : "#fff",
      correctLevel : window.QRCode.CorrectLevel.H
    });
    this.setState({elementQRCode:qrcode})
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { isFocusOnWindow, loadingShow, nickname, boxesList, selectBox, isOnFocusInput, boxesIsLoading, orderMoney, productNum, showPayQRCode, needToPay} = this.state;
    return (
      <div className="commoditiesPackaging contentMain">
        {/*这里存放公共信息, 用于表示登录用户, 以及退出登录*/}
        <div className="titleLine">
          <h1 className="title">商品录入,箱子打包</h1>
          <div className="nickName">当前用户: {nickname}</div>
          <Button className="loginOut"
                  type="danger"
                  onClick={this.loginOut.bind(this)}
          ><Icon type="close-circle" />退出当前用户</Button>
        </div>

        {/*这里存放用户名下带发货的箱子, 商品, 以及数量价格等信息*/}
        <div className="main">
          {/*存放加载提示图标*/}
          {boxesIsLoading &&
            <div className="loading">
              <Icon type="loading" />
            </div>
          }

          {/*这里用作箱子信息存放*/}
          <div className="boxes" style={{opacity:(boxesIsLoading ? .3 : 1)}}>
            {needToPay &&
              <div>
                <div id="showQRCode"/>
                <div>仍有订单未支付, 请先支付</div>
                <div style={{marginTop: 5}}>或选择
                  <Button type="primary"
                          style={{marginLeft: 10}}
                          onClick={this.offLinePay.bind(this)}
                  >线下支付</Button>
                </div>
                {this.allow(127) && <div style={{marginTop: 5}}>如是自营包裹, 请选择
                  <Button type="danger"
                          style={{marginLeft: 10}}
                          onClick={this.payByProprietary.bind(this)}
                  >自营包裹放行</Button>
                </div>}
              </div>
            }
            {/*第一层遍历, 取出所有箱子信息, 将箱号与箱内数据取出并使用*/}
            {boxesList.map((boxItem,boxKey) => {
              // console.log(boxItem);
              // console.log(boxKey);
              return (
                <div className="box"
                     id={`box_${boxKey}`}
                     key={`box_${boxKey}`}
                     style={{border: (boxItem.parcelNo === selectBox ? `2px solid rgba(255,0,0,.5)` : `none`)}}
                     onClick={()=>{this.setState({selectBox: boxItem.parcelNo})}}
                >
                  {/*这里用以显示箱子的公共信息, 如编号, 想箱号, 以及删除箱子按钮*/}
                  <Row className="boxTitleLine boxInfo" >
                    <Col span={3}> {boxKey+1} 号箱</Col>
                    <Col span={8}> 箱号: {boxItem.parcelNo}</Col>
                    <Col span={5}>
                      <div>
                        <div className="boxWeightLine">
                          <span className="boxWeightInfo" style={{color:'rgba(255,0,0,.8'}}>重量: </span>
                          <InputNumber className="boxWeight"
                                       id={`boxWeight_${boxKey}`}
                                       style={!boxItem.parcelWeight ? {border:`1px solid rgba(255,0,0,.5)`} : {}}
                                       max={99.9} min={0.1}
                                       precision={1}
                                       value={boxItem.parcelWeight}
                                       onChange={this.onChangeBoxWeight.bind(this,boxKey,boxItem.parcelNo)}
                                       onBlur={this.onBlurBoxWeight.bind(this,boxKey,boxItem.parcelNo)}
                                       onFocus={this.onFocusBoxWeight.bind(this,boxKey,boxItem.parcelNo)}
                          />
                          <span className="boxWeightUnit">Kg</span>
                        </div>
                        <div className="boxWeightWarn">
                          {boxItem.parcelNo === selectBox && isOnFocusInput &&
                          <p>
                            正在编辑箱重, 暂停扫码器相关功能
                          </p>
                          }
                        </div>
                      </div>
                    </Col>
                    <Col span={5}>
                      {boxItem.parcelNo === selectBox ? <span style={{color:'rgba(255,0,0,.6)'}}>当前所选箱子</span> : ``}
                    </Col>
                    <Col span={3}>
                      <Button type="danger"
                              size="small"
                              className="delBox"
                              disabled={!(boxItem.parcelProductVoList === null ? true : (boxItem.parcelProductVoList.length === 0))}
                              onClick={this.deleteParcelByParcelNo.bind(this,boxItem.parcelNo,boxKey)}
                      ><Icon type="close-circle" />删除箱子</Button>
                    </Col>
                  </Row>
                  {/*这里用于存放箱内数据表头*/}
                  <Row className="boxTitleLine"
                  >
                    <Col span={3} >
                      <span>序号</span>
                    </Col>
                    <Col span={6} >
                      <span>商品条码</span>
                    </Col>
                    <Col span={10} >
                      <span>商品名称</span>
                    </Col>
                    <Col span={5} >
                      <span>数量</span>
                      <span>({(()=>{
                        let Num = 0;
                        if (boxItem.parcelProductVoList) for (let n of boxItem.parcelProductVoList) {
                          // console.log(n.productNum);
                          Num += n.productNum;
                        }
                        return Num;
                      })()})</span>
                    </Col>
                  </Row>
                  <div className="boxMain">
                    {/*第二层遍历, 取到单个箱内所有商品的数据*/}
                    {!boxItem.parcelProductVoList ? `` :
                      boxItem.parcelProductVoList.map((commoditiesItem,commoditiesKey) => {
                      return (
                        // 这里做取模运算, 隔行显示不同的底色
                        <Row className={`commoditiesInfo commoditiesInfo_${commoditiesKey+1}
                                        rowLineColor_${(commoditiesKey+1)%2 !== 0 ? 'light' : 'dark'}`}
                             key={`commoditiesInfo_${commoditiesKey+1}`}
                        >
                          <Col className="infoCol" span={3}>{commoditiesKey+1}</Col>
                          <Col className="infoCol" span={6}>{commoditiesItem.productCode}</Col>
                          <Col className="infoCol" span={10} title={commoditiesItem.productName}>{commoditiesItem.productName}</Col>
                          <Col className="infoCol" span={5}>
                            <div className="btnPM" style={{marginRight: 10}}
                                 onClick={this.changeProductNumber.bind(this,'minus',commoditiesItem.productCode,boxItem.parcelNo)}
                            >-</div>
                            {commoditiesItem.productNum}
                            <div className="btnPM" style={{marginLeft: 10}}
                                 onClick={this.changeProductNumber.bind(this,'plus',commoditiesItem.productCode,boxItem.parcelNo)}
                            >+</div>
                          </Col>
                        </Row>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="packInfo">
            <div className="packInfoLine">
              <span>物流方案: BC</span>
            </div>
            <div className="packInfoLine">
              <span>共 {boxesList.length} 箱, </span>
              <span>共 {productNum} 件商品, </span>
              <span>合计(人民币): {orderMoney}</span>
              <Button type="primary"
                      style={{marginLeft: 10}}
                      onClick={this.createOrder.bind(this)}
                      disabled={boxesIsLoading || isOnFocusInput || needToPay}
              >完成, 去支付</Button>
            </div>
          </div>
        </div>

        <Modal title="扫码支付"
               wrapClassName="QECodePayModal"
               visible={showPayQRCode}
               onOk={()=>this.setState({showPayQRCode: false})}
               onCancel={()=>this.setState({showPayQRCode: false},() => {
                 this.getParcelProductListByUnionId();
               })}
               forceRender
               bodyStyle={{textAlign: `center`,}}
        >
          <div className="QRCodeLine">
            <div id="payQRCodeShow"
                 style={{width:200,height:200,display:`inline-block`}}
            />
          </div>
          <div style={{fontSize: `18px`}}
               className="infoLine">
            <div>订单已生成, 请扫码支付</div>
            <div style={{marginTop: 5}}>或选择
              <Button type="primary"
                      style={{marginLeft: 10}}
                      onClick={this.offLinePay.bind(this)}
              >线下支付</Button>
            </div>
            {this.allow(127) && <div style={{marginTop: 5}}>如是自营包裹, 请选择
              <Button type="danger"
                      style={{marginLeft: 10}}
                      onClick={this.payByProprietary.bind(this)}
              >自营包裹放行</Button>
            </div>}
          </div>
        </Modal>

        {isFocusOnWindow &&
          // 遮罩层, 用于保证用户焦点停留于该页面中, 否则显示该遮罩, 并提示需要点击
          <div className="isFocusOnWindow"
               onClick={() => this.setState({isFocusOnWindow: false})}
          >
            <p className="focusInfo"><Icon type="info-circle" /> 请点击屏幕, 以便确保页面可以获取扫码器数据</p>
          </div>
        }

        {loadingShow &&
          // 遮罩层, 用于显示加载画面
          <div className="loadingShow">
            <p className="loadingTxt"><Icon type="loading" /> 更新并获取信息中, 请稍后...</p>
          </div>
        }
      </div>
    )
  }
}

export default commoditiesPackaging;