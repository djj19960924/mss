import { observable, action, autorun } from 'mobx';

class AppStore {
  // 利用cookie来判断用户是否登录，避免刷新页面后登录状态丢失
  @observable isLogin = (window.getCookie('isLogin') === 'true');

  @observable userData = localStorage.userData ? JSON.parse(localStorage.userData) : {};

  @observable allowSideList = localStorage.allowSiderList ? JSON.parse(localStorage.allowSiderList) : [];

  @observable props = null;

  //action用来改变被observable修饰的这些数据
  @action saveUserData = (data) => {
    this.userData = data;
    localStorage.userData = JSON.stringify(data);
    localStorage.historyUserName = data.userName;
  };

  @action clearAllData = () => {
    this.userData = {};
    localStorage.removeItem('userData');
    localStorage.removeItem('allowSiderList');
  };

  @action saveAllowSideList = (data) => {
    this.allowSideList = data;
    localStorage.allowSiderList = JSON.stringify(data);
  };

  @action getAllow = (Num) => {
    return [...this.allowSideList].includes(Num);
  }

  // // 模拟用户数据库
  // @observable users = [];
  // @observable loginUser = {};  //当前登录用户信息
  // @action initUsers() {
  //   const localUsers = localStorage['users'] ? JSON.parse(localStorage['users']) : [];
  //   this.users = [{username: 'admin', password: 'admin'},...localUsers]
  // }
}

export default new AppStore()