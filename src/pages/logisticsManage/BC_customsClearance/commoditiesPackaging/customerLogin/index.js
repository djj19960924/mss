import React from 'react';
import { Icon, message, } from 'antd';
import allowedKeys from "@js/allowedKeys";

import './index.less';
class customerLogin extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      elementQRCode: null,
      // 判断页面是否为激活状态, 当 window 失去焦点时, 页面进入待机遮罩状态
      isFocusOnWindow: true,
      // 加载显示
      loadingShow: false,
    };
  }

  componentDidMount() {
    let lastInputTime = null, inputValue = ``;
    let doTimeOut = null;
    const showLoading = Is => this.setState({loadingShow: Is});
    const rule = new RegExp('^unionId:');
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
          // 成功通过开头为 "unionId:" 的校验
          if (rule.test(inputValue)) {
            const unionId = inputValue.split('&')[0].split(`unionId:`)[1];
            const nickname = decodeURIComponent(inputValue.split('&')[1].split(`nickname:`)[1]);
            if (unionId.length >= 28 && unionId.length <= 32) {
              // 如果长度也符合, 那么则可以模糊判定所获取到的信息为 unionId
              // 当符合条件的时候, 则可以进行接口操作, 根据 unionId 获取该用户下所有转运箱号资料
              message.success(`成功获取用户信息,即将跳转`);
              this.props.history.push(`/logistics-manage/BC-customsClearance/commodities-packaging/?unionId=${unionId}&nickname=${nickname}`)
            } else {
              message.error(`获取用户信息失败, 请重试`)
            }
          } else {
            message.error(`二维码格式错误, 请确保用户登录二维码正确, 并重试`);
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
    window.onblur = () => {
      // console.log(`失去焦点!`);
      this.setState({isFocusOnWindow: true})
    };
    // window.onfocus = () => {
      // 由于失去焦点以后会生成全页面遮罩, 所以点击该遮罩即可确保获取焦点,
      // 而onfocus事件仅会在失去焦点的状态中生效, 故无需重复设置, 这里备注仅为出现特殊情况而作备选操作
      // console.log(`获得焦点!`);
    // };

    // 注释原因: 为防止客户/工作人员混乱, 故不开放多余授权扫码入口
    // let isTest = false;
    // if (window.isServerTest) isTest = true;
    // if (window.isLocalTest) isTest = true;
    // 生成导向用户授权登录的扫码页面
    // let qrcode = new window.QRCode(this.refs.QRCodeShow, {
    //   text: `http://api.maishoumiji.com/wechat/authorize?returnUrl=http%3A%2F%2F${isTest ? 'test' : ''}m.maishoumiji.com/%23/logisticsstatus`,
    //   width: 200,
    //   height: 200,
    //   colorDark : "#000",
    //   colorLight : "#fff",
    //   correctLevel : window.QRCode.CorrectLevel.H
    // });
    // this.setState({elementQRCode:qrcode})
  }

  componentWillUnmount() {
    // 组件关闭以后, 卸载window事件
    window.onkeyup = window.onkeydown = window.onblur = window.onfocus = null;
    // 卸载异步操作设置状态
    this.setState = () => null
  }
  render() {
    const { isFocusOnWindow, loadingShow, } = this.state;
    return (
      <div className="customerLogin">
        <h1 className="title">客户登录</h1>
        <h2 className="subtitle">请用户打开BuyersHouse公众号, 找到身份码并展示</h2>

        {/*<h2 className="info">可以用微信扫下方二维码, 进入授权登录界面</h2>*/}
        {/*<div className="QRCodeShow"*/}
             {/*ref="QRCodeShow"*/}
        {/*/>*/}

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
            <p className="loadingTxt"><Icon type="loading" /> 加载中, 请稍后...</p>
          </div>
        }
      </div>
    )
  }
}

export default customerLogin;