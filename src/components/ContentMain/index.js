import React from 'react';
import {Route, Switch, withRouter} from 'react-router-dom';
// 这里引用各个组件内容, 内容为方便管理, 统一写入pages页面
// 主页
import Home from '@pages/Home/';

// 权限管理
  // 角色管理
  import roles from '@pages/users/roles/';
  // 账户管理
  import accounts from '@pages/users/accounts/';
  // 权限列表
  import permissions from '@pages/users/permissions/';

//客户管理
  //客户信息管理
  import customerInfo from '@pages/customer/customerInfo/';
    //客户详细信息
    import customerInfoDetail from '@pages/customer/customerInfo/detail/';
  //客户级别管理
  import customerLevel from '@pages/customer/customerLevel/';

import menus from "../SiderNav/menus";

const componentsList = {
  Home,
  roles,
  accounts,
  permissions,
  customerInfo,
  customerLevel,
  customerInfoDetail
};

@withRouter
// @inject('appStore') @observer
class ContentMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menusList: [],
      routesList: [],
      allowSideList: this.props.allowSideList
    };
    // 解析components
    for (let obj of menus) {
      if (obj.components) {
        this.state.menusList.push({components: obj.components, id: obj.id, testType: obj.testType})
      } else {
        for (let obj1 of obj.subs) {
          if (obj1.components) {
            this.state.menusList.push({components: obj1.components, id: obj1.id, testType: obj1.testType})
          } else {
            for (let obj2 of obj1.subs) this.state.menusList.push({
              components: obj2.components,
              id: obj2.id,
              testType: obj2.testType
            })
          }
        }
      }
    }
  }

  componentWillMount() {
    // 用于更新已处于登陆状态的用户刷新页面以后的路由组件信息
    this.getNewRoutesList(this.props.allowSideList)
    // this.getNewRoutesList()
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    // 这里兼容未添加 allowSideList 传参的情况
    if (this.props.allowSideList) {
      if (this.props.roleId !== nextProps.roleId ||
        this.props.allowSideList.length !== nextProps.allowSideList.length) {
        // console.warn('渲染了路由');
        this.getNewRoutesList(nextProps.allowSideList);
      }
    }
  }

  getNewRoutesList(allowSideList) {
    const dataList = [];
    this.setState({pageLoading: true});
    const {menusList} = this.state;
    for (let obj of menusList) {
      // 添加测试判断
      if (obj.testType) if (window.testType !== 'localTest') if (obj.testType !== window.testType) continue;
      // 添加权限判断
      // 这里兼容未添加 allowSideList 传参的情况
      if (!allowSideList.includes(obj.id)) continue;
      for (let obj1 of obj.components) dataList.push(<Route exact path={obj1.path} component={componentsList[obj1.name]}
                                                            key={obj1.path}/>);
    }
    // 渲染层对 routesList 做出了判断, 被迫进行了和 setState 相同的功能
    // 不直接使用 setState, 是因为该方法会在组件卸载时重复渲染, 造成内存负载, 会导致 react 报错
    // this.setState({routesList: dataList})
    this.state.routesList = dataList;
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }

  render() {
    const {routesList} = this.state;
    return (
      <div style={{backgroundColor: '#eee', width: '100%', height: '100%', padding: '10px'}}>
        {/*这里只在 routesList 内部有数据时才渲染 Switch 标签, 以防渲染过程中出现 404*/}
        {!!routesList.length &&
        <Switch>
          {/*放置循环路由*/}
          {routesList}
        </Switch>
        }
      </div>
    )
  }
}

export default ContentMain;