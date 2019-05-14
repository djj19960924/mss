import React from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { message } from 'antd';

import './index.less';

@withRouter @inject('appStore') @observer
class HeaderBar extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      // 这里保存当前用户名
      userName: this.props.appStore.userData.userName,
      // message: 3,
    };
  }
  loginOut() {
    const { history, location, } = this.props;
    this.ajax.post('/login/logout').then(r => {
      if (r.data.status === 10000) message.success(r.data.msg);
      r.showError(message);
      // 清除cookie中所保存的登录信息, 这里只清除模拟数据isLogin
      window.delCookie('isLogin');
      history.push(`/login?historyPath=${location.pathname}${encodeURIComponent(location.search)}`);
    }).catch(r => {
      console.error(r);
      message.error('前端接口调取/数据处理出现错误, 请联系管理员');
    });
  }
  render() {
    return(
      <div className="HeaderBar">
        <div className="logo">BuyersHouse后台管理系统</div>
        <div className="userInfo">
          <ul>
            {/*简单判断剩余消息信息*/}
            {/*<li className={this.state.message ? 'message hasMessage' : 'message'}
                   onClick={this.clearMessage.bind(this)}>*/}
              {/*{this.state.message ? '有 ' : '暂无'}*/}
              {/*<span style={{color:'red'}}>{this.state.message ? this.state.message : ''}</span>*/}
              {/*{this.state.message ? ' 条' : ''}消息*/}
            {/*</li>*/}
            {/*这里动态显示用户名*/}
            <li>欢迎回来! {this.state.userName}</li>
            <li className="loginOut" onClick={this.loginOut.bind(this)}>退出登录</li>
          </ul>
        </div>
      </div>
    )}
}

export default HeaderBar;