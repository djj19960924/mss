import React from 'react';
import { message, Icon, Button, Row, Col, InputNumber, Modal, } from 'antd';
import allowedKeys from "@js/allowedKeys/";
import './index.less';

class SKTCommoditiesInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      boxesIsLoading: false,
      productNum: 0,
      isFocusOnWindow: true,
      isSelectBox: false,
      parcelCode: null,
      productCode: null,
      currentBoxInfo: {},
      isOnFocusInput: false,
      parcelWeight: null
    }
  }

  componentDidMount() {
    this.loadKeyListener();
    window.onblur = () => {
      // console.log(`失去焦点!`);
      this.setState({isFocusOnWindow: true})
    };
    const parcelCode = window.getCookie('parcelCode');
    if (!!parcelCode) {
      this.setState({parcelCode},() => {
        this.getUserInfoByParcelCode();
      });
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
          console.log(inputValue);
          const {parcelCode, isSelectBox} = this.state;
          if (ruleBox.test(inputValue)) {
            // 箱号判断, 调取接口添加箱子至该用户名下
            if (inputValue.length === 14) {
              // message.success(`识别为箱号: ${inputValue}`);
              if (parcelCode !== null) {
                message.warn(`请完成当前箱子的操作再扫取新的箱号`)
              } else {
                this.setState({parcelCode: inputValue},() => {
                  this.getUserInfoByParcelCode();
                });
              }
            } else {
              message.error(`识别为箱号, 但是长度不正确, 请重新扫描`);
            }
          } else {
            // 商品条码判断, 调取接口添加商品进当前箱子
            // message.success(`识别为条形码: ${inputValue}`);
            if (isSelectBox) {
              this.setState({productCode: inputValue},() => {
                this.entryProduct();
              });
            } else {
              message.error('请先录入箱号');
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

  // 录入商品
  entryProduct() {
    const {parcelCode, productCode} = this.state;
    const data = {parcelCode, productCode};
    this.ajax.post('/backend/SktProductManage/entryProduct', data).then(r => {
      if (r.data.status === 10000) {
        message.success('成功录入商品');
        this.setState({currentBoxInfo: r.data.data});
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 增加/减少箱内指定商品数量
  changeProductNumber(type, productCode, productPrice) {
    const {parcelCode} = this.state;
    const data = {parcelCode, productCode, productPrice};
    const url = (type === 'plus')
      ? '/backend/SktProductManage/cumulateProductNum'
      : '/backend/SktProductManage/decreaseProductNum';
    this.ajax.post(url, data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        message.success(`${type === 'plus' ? '增加' : '删除'}商品成功`);
        this.setState({currentBoxInfo: data});
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 根据包裹单号获取用户信息、商品列表
  getUserInfoByParcelCode() {
    const {parcelCode} = this.state;
    const data = {parcelCode};
    this.ajax.post('/backend/SktProductManage/getUserInfoByParcelCode', data).then(r => {
      if (r.data.status === 10000) {
        this.setState({
          isSelectBox: true,
          currentBoxInfo: r.data.data
        },() => {
          window.setCookie('parcelCode', parcelCode, 3600);
        });
      } else {
        this.clearBox();
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.clearBox();
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 焦点进入箱重输入框触发
  onFocusBoxWeight() {
    this.setState({isOnFocusInput: true});
    this.unloadKeyListener();
    window.onkeyup = (e) => {
      if (e.key === `Enter`) document.querySelector(`#boxWeight`).blur();
    }
  }

  // 离开箱重输入框触发
  onBlurBoxWeight() {
    // 这里触发接口调取, 参数值为 currentBoxInfo.parcelWeight
    this.loadKeyListener();
    this.setState({isOnFocusInput: false});
  }

  // 保存重量和订单
  saveParcel() {
    const {parcelWeight, parcelCode} = this.state;
    if (!parcelWeight) {
      message.error('请输入重量');
    } else {
      const data = {parcelWeight, parcelCode};
      this.ajax.post('/backend/SktProductManage/saveParcel', data).then(r => {
        if (r.data.status === 10000) {
          message.success(r.data.msg);
          this.clearBox();
        }
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    }
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    // 组件关闭以后, 卸载window事件
    this.unloadKeyListener();
    // 卸载异步操作设置状态
    this.setState = () => null
  }

  // 清空箱子信息
  clearBox() {
    this.setState({
      isSelectBox: false,
      parcelCode: null,
      currentBoxInfo: null,
      isOnFocusInput: false,
      parcelWeight: undefined
    },() => {
      window.delCookie('parcelCode');
    });
  }

  render() {
    const {boxesIsLoading, isFocusOnWindow, isSelectBox, currentBoxInfo, isOnFocusInput, parcelWeight} = this.state;
    return (
      <div className="SKTCommoditiesInput">
        <div className="title">
          <div className="titleMain">扫码录入商品</div>
          <div className="titleLine" />
        </div>
        {isSelectBox
          ? <div className="main">
              {/*存放加载提示图标*/}
              {boxesIsLoading &&
              <div className="loading">
                <Icon type="loading" />
              </div>
              }
              {/*箱子内部*/}
              <div className="boxes">
                <div className="box">
                  <Row className="boxTitleLine boxInfo" >
                    <Col span={8} className="boxNum">箱号: {currentBoxInfo.parcelCode}</Col>
                    <Col span={8}>
                      <div>
                        <div className="boxWeightLine">
                          <span className="boxWeightInfo" style={{color:'rgba(255,0,0,.8'}}>重量: </span>
                          <InputNumber className="boxWeight"
                                       id="boxWeight"
                                       style={!currentBoxInfo.parcelWeight ? {border:`1px solid rgba(255,0,0,.5)`} : null}
                                       max={99.9} min={0.1}
                                       precision={1}
                                       // value={currentBoxInfo.parcelWeight}
                                       value={parcelWeight}
                                       onChange={v => {
                                         this.setState({parcelWeight: v});
                                       }}
                                       onBlur={this.onBlurBoxWeight.bind(this)}
                                       onFocus={this.onFocusBoxWeight.bind(this)}
                          />
                          <span className="boxWeightUnit">Kg</span>
                        </div>
                        <div className="boxWeightWarn">
                          {isOnFocusInput &&
                          <p>
                            正在编辑箱重, 暂停扫码器相关功能
                          </p>
                          }
                        </div>
                      </div>
                    </Col>
                    <Col span={8} title={currentBoxInfo.nickname}>客户昵称: {currentBoxInfo.nickname}</Col>
                  </Row>
                  <Row className="boxTitleLine" >
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
                      {/*这里动态添加商品数量提示*/}
                      {null && '这里动态添加商品数量提示'}
                    </Col>
                  </Row>
                  <div className="boxMain">
                    {currentBoxInfo.sktProductVoList.map((Item, index) => {
                      return (
                        <Row className={`commoditiesInfo rowLineColor_${(index + 1) % 2 !== 0 ? 'light' : 'dark'}`}
                             key={index}>
                          <Col className="infoCol" span={3}>{index + 1}</Col>
                          <Col className="infoCol" span={6}>{Item.productCode}</Col>
                          <Col className="infoCol" span={10} title={Item.productName}>{Item.productName}</Col>
                          <Col className="infoCol" span={5}>
                            <div className="btnPM" style={{marginRight: 10}}
                              onClick={this.changeProductNumber.bind(this,'minus', Item.productCode, Item.productPrice)}
                            >-</div>
                            {Item.productNum}
                            <div className="btnPM" style={{marginLeft: 10}}
                              onClick={this.changeProductNumber.bind(this,'plus', Item.productCode, Item.productPrice)}
                            >+</div>
                          </Col>
                        </Row>
                      )})
                    }

                  </div>
                </div>
              </div>
              {/*包裹信息*/}
              <div className="packInfo">
                <div className="packInfoLine">
                  <span>物流方案: BC</span>
                </div>
                <div className="packInfoLine">
                  <span>共 {currentBoxInfo.productNum ? currentBoxInfo.productNum : 0} 件商品, </span>
                  <Button type="danger"
                          style={{marginLeft: 10}}
                          onClick={this.clearBox.bind(this)}
                  >退出</Button>
                  <Button type="primary"
                          style={{marginLeft: 10}}
                          onClick={this.saveParcel.bind(this)}
                  >完成</Button>
                </div>
              </div>
            </div>
          : <div className="needBoxNum">请扫码录入箱号</div>
        }

        {isFocusOnWindow &&
        // 遮罩层, 用于保证用户焦点停留于该页面中, 否则显示该遮罩, 并提示需要点击
        <div className="isFocusOnWindow"
             onClick={() => this.setState({isFocusOnWindow: false})}
        >
          <p className="focusInfo"><Icon type="info-circle" /> 请点击屏幕, 以便确保页面可以获取扫码器数据</p>
        </div>
        }
      </div>
    );
  }
}

export default SKTCommoditiesInput;