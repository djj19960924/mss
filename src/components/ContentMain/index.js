import React from 'react';
import {Route, Switch, withRouter} from 'react-router-dom';
// 这里引用各个组件内容, 内容为方便管理, 统一写入pages页面
// 主页
import Home from '@pages/Home/';

// 404页面
import page404 from '@pages/system/page404/'

// 开发人员专用调试
import importExcel from '@pages/developerPages/importExcel/';
import test from '@pages/developerPages/test';

// 日志页面
import logs from '@pages/system/logs/';

// 权限管理
  // 角色管理
  import roles from '@pages/users/roles/';
  // 账户管理
  import accounts from '@pages/users/accounts/';
  // 权限列表
  import permissions from '@pages/users/permissions/';

//基础设置
  //汇率
  import ExchangeRate from '@pages/foundationSetup/exchangeRate/';

// 物流管理
  //线下支付
  import OfflinePayment from "@pages/logisticsManage/offlinePayment/";

  // bc清关
    // bc商品打包
    import commoditiesPackaging from "@pages/logisticsManage/BC_customsClearance/commoditiesPackaging/";
    // 打包登陆用户
    import customerLogin from "@pages/logisticsManage/BC_customsClearance/commoditiesPackaging/customerLogin/";
    // bc清关
    import YTO from "@pages/logisticsManage/BC_customsClearance/YTO/";
    // bc推单
    import BCUploadOrder from "@pages/logisticsManage/BC_customsClearance/uploadOrder/";

  // ETK订单
    // 已匹配
    import orderMatched from '@pages/logisticsManage/ETK/matched/';
    // 未匹配
    import orderUnmatched from '@pages/logisticsManage/ETK/unmatched/';

  // 邮政订单
    // 已推送
    import orderPushed from '@pages/logisticsManage/postal/pushed/';
    // 未推送
    import orderNotPushed from '@pages/logisticsManage/postal/notPushed/';

  // 速跨通
    // 待录入列表
    import SKTListToBeEntered from '@pages/logisticsManage/SKT/listToBeEntered/';
    // 扫码录入商品
    import SKTCommoditiesInput from '@pages/logisticsManage/SKT/commoditiesInput/';
    // BC推单
    import SKTUploadOrder from '@pages/logisticsManage/SKT/uploadOrder/';
    // 圆通物流
    import SKTYto from '@pages/logisticsManage/SKT/YTO/';

  // 全球运转
    // 已收货
    import globalTranshipmentArrived from '@pages/logisticsManage/globalTranshipment/arrived/';
    // 未收货
    import globalTranshipmentNotArrived from '@pages/logisticsManage/globalTranshipment/notArrived/';

// 预约
  // 预约接送机
  import airportTransfer from '@pages/reservationService/airportTransfer/';
  // 预约打包
  import appointmentInfo from '@pages/reservationService/appointmentInfo/';

//全球跑腿
    //全球跑腿预订
    import GlobalErrandsOrder from '@pages/reservationService/globalErrands/order/';
    //编辑进度
    import EditProgress from '@pages/reservationService/globalErrands/order/editProgress/'; 
    //全球跑腿评价
    import GlobalErrandsAssess from '@pages/reservationService/globalErrands/assess/';

// 返点
  // 已支付
  import adoptExaminePaid from '@pages/rebateManage/adoptExaminePaid/';
  // 未支付
  import adoptExamineUnpaid from '@pages/rebateManage/adoptExamineUnpaid/';
  // 驳回
  import rejectExamine from '@pages/rebateManage/rejectExamine/';
  // 更新二维码
  import updateQRCode from '@pages/rebateManage/updateQRCode/';
  // 审核小票
  import awaitingExamine from '@pages/rebateManage/awaitingExamine/';
  // 设置返点
  import setRebate from '@pages/rebateManage/setRebate/';
  // 对账
  import countBillList from '@pages/rebateManage/countBillList/';
  // 挂团
  import appointmentTeamManage from '@pages/rebateManage/appointmentTeamManage/';
  // 返点说明文案设置
  import rebateCountryInfo from '@pages/rebateManage/rebateCountryInfo/'
  //返点用户表
  import rebateUser from '@pages/rebateManage/rebateUser/'

// 商品管理
  // 商品数据库
  import commoditiesDataBase from '@pages/commoditiesManage/commoditiesDatabase/';
  import commoditiesCreateAndEdit from '@pages/commoditiesManage/commoditiesDatabase/commoditiesCreateAndEdit/';
  import commoditiesImgList from '@pages/commoditiesManage/commoditiesDatabase/commoditiesImgList/';

import menus from "../SiderNav/menus";

const componentsList = {
  Home,
  importExcel,
  roles,
  accounts,
  permissions,
  commoditiesPackaging,
  customerLogin,
  YTO,
  BCUploadOrder,
  orderMatched,
  orderUnmatched,
  orderPushed,
  orderNotPushed,
  globalTranshipmentArrived,
  globalTranshipmentNotArrived,
  airportTransfer,
  appointmentInfo,
  GlobalErrandsOrder,
  EditProgress,
  GlobalErrandsAssess,
  adoptExaminePaid,
  adoptExamineUnpaid,
  rejectExamine,
  updateQRCode,
  awaitingExamine,
  setRebate,
  countBillList,
  appointmentTeamManage,
  commoditiesDataBase,
  commoditiesCreateAndEdit,
  commoditiesImgList,
  ExchangeRate,
  OfflinePayment,
  SKTListToBeEntered,
  SKTCommoditiesInput,
  SKTUploadOrder,
  SKTYto,
  rebateCountryInfo,
  rebateUser,
  logs,
  test
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
          {/*404*/}
          <Route component={page404}/>
        </Switch>
        }
      </div>
    )
  }
}

export default ContentMain;