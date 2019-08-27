import React from "react";
import {Table, Pagination, Button, Modal, Input, message} from "antd";
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class customerInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableDataList: [],
      pageTotal: 0,
      pageSize: 100,
      pageNum: 1,
      pageSizeOptions: ['50','100','200','300'],
      tableLoading: false,
      // 搜索参数
      parm: '',
      unionId: '',
      showEditModal: false,
      modalLoading: false,
      modalType: 'manager',
      phoneNum: '',
      saleNote: '',
      manager: '',
      wechatNo: ''
    };
  }
  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    this.getCustomerInfoList()
  }

  getCustomerInfoList() {
    const {pageNum, pageSize, parm} = this.state;
    const showLoading = Is => this.setState({tableLoading: Is});
    showLoading(true);
    const data = {pageNum, pageSize, parm: parm.trim()};
    this.ajax.post('/backend/customer/getCustomerInfoList', data).then(r => {
      const {data, status} = r.data;
      const dataObj = {
        tableDataList: data.list,
        pageTotal: data.total,
        pageSizeOptions : ['50','100','200',`${data.total > 300 ? data.total : 300}`]
      };
      if (status < 10000) {
        dataObj.pageTotal = 0;
        dataObj.tableDataList = [];
        dataObj.pageSizeOptions = ['50','100','200','300']
      }
      this.setState(dataObj);
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  editSaleInfoByUnionId() {
    const {modalType,saleNote,manager,unionId,phoneNum,wechatNo} = this.state;
    const data = {unionId};
    if (modalType === 'manager') {
      data.manager = manager
    } else if (modalType === 'saleNote') {
      data.saleNote = saleNote
    } else if (modalType === 'phoneNum') {
      data.phoneNum = phoneNum
    } else if(modalType === 'wechatNo'){
      data.wechatNo = wechatNo
    } else {
      message.error('类型异常!')
    }
    const showLoading = Is => this.setState({modalLoading: Is});
    showLoading(true);
    this.ajax.post('/backend/customer/editSaleInfoByUnionId', data).then(r => {
      const {status, msg} = r.data;
      if (status === 10000) {
        message.success(msg);
        const setData = {
          showEditModal: false
        };
        this.setState(setData);
        this.getCustomerInfoList();
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  changePage(pageNum, pageSize) {
    this.setState({pageNum, pageSize},()=>{
      this.getCustomerInfoList();
    });
  }

  showDetails(record) {
    const style = {float:'left',width:'120px'}, hidden = {overflow:'hidden'}, title = {color: '#000', fontSize: '18px', margin: '4px 0'};
    Modal.info({
      title: '查看客户详情',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      // width: 600,
      content: <div style={hidden}>
        <div style={title}>- 全球跑腿 -</div>
        <div style={hidden}><div style={style}>全球跑腿: </div>{record.legworkInfoVo.reservationTotal ?
          record.legworkInfoVo.reservationTotal : 0} 次</div>
        <div style={title}>- 返点 -</div>
        <div style={hidden}><div style={style}>待返现: </div>{record.rebateInfoVo ?
          record.rebateInfoVo.returningMoney : 0} 元</div>
        <div style={hidden}><div style={style}>已返现: </div>{record.rebateInfoVo ?
          record.rebateInfoVo.returnedMoney : 0} 元</div>
        <div style={hidden}><div style={style}>余额: </div>{record.rebateInfoVo ?
          record.rebateInfoVo.balance : 0} 元</div>
        <div style={title}>- 接送机 -</div>
        <div style={hidden}><div style={style}>接机: </div>{record.transferInfoVo.receptionTotal ?
          record.transferInfoVo.receptionTotal : 0} 次</div>
        <div style={hidden}><div style={style}>送机: </div>{record.transferInfoVo.sendTotal ?
          record.transferInfoVo.sendTotal : 0} 次</div>
        <div style={title}>- 物流 -</div>
        <div style={hidden}><div style={style}>速跨通: </div>{record.logisticsInfoVo.sktTotal ?
          record.logisticsInfoVo.sktTotal : 0} 次</div>
        <div style={hidden}><div style={style}>BC: </div>{record.logisticsInfoVo.bcTotal ?
          record.logisticsInfoVo.bcTotal : 0} 次</div>
        <div style={hidden}><div style={style}>ETK: </div>{record.logisticsInfoVo.etkTotal ?
          record.logisticsInfoVo.etkTotal : 0} 次</div>
        <div style={hidden}><div style={style}>邮政: </div>{record.logisticsInfoVo.postalTotal ?
          record.logisticsInfoVo.postalTotal : 0} 次</div>
        <div style={hidden}><div style={style}>全球运转: </div>{record.logisticsInfoVo.globalTotal ?
          record.logisticsInfoVo.globalTotal : 0} 次</div>
      </div>
    })
  }

  render() {
    const hidden = {overflow: 'hidden'};
    // const left = {float: 'left'};
    // const right = {float: 'right'};
    const remarks = {lineHeight: '16px', padding: '8px 0',whiteSpace: 'pre-wrap'};
    const ellipsis = {textOverflow:'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'};
    const tabsStyle = {display: 'inline-block',border: '1px solid rgba(64,158,255,.2)', borderRadius: '5px', padding: '2px 4px', margin: '2px 4px', color: '#409eff', backgroundColor: 'rgba(64,158,255,.1)'};
    const columns = [
      {title: '头像', dataIndex: 'headImg', key: 'headImg', width:60,
        render: text => {
          if(text) {
            return <img src={text} alt=""
                 style={{width: 40, height: 40, display: 'block'}}
            />
          } else {
            return <div style={{width: 40, height: 40,lineHeight: '40px'}}>无</div>
          }
        }
      },
      {title: '微信名', dataIndex: 'nickname', key: 'nickname', width: 160,
        render: nickname => (
          <div style={Object.assign({width: 139}, ellipsis)}
               title={nickname}
          >{nickname}</div>
        )
      },
      {title: '手机号', dataIndex: 'phoneNum', key: 'phoneNum', width: 140,
        render: (text,record) => (
          <div  style={hidden}>
            <table>
              <tbody>
              <tr>
                <td style={{padding: 0,width: 'calc(100% - 32px)'}}><div style={remarks}>{text ? text : '暂无'}</div></td>
                <td style={{padding: 0,width: '32px'}}>
                  <Button type="link"
                          icon="form"
                          style={{padding: 0}}
                          onClick={() => this.setState({
                            unionId: record.unionId,
                            showEditModal: true,
                            modalType: 'phoneNum',
                            manager: record.phoneNum ? record.phoneNum : ''
                          })}
                          disabled={!this.allow(137)}
                          title={!this.allow(137) ? '没有该操作权限' : null}
                  /></td>
              </tr>
              </tbody>
            </table>
          </div>
        )
      },
      {title: '跟进人', dataIndex: 'manager', key: 'manager', width: 160,
        render: (text,record) => (
          <div  style={hidden}>
            <table>
              <tbody>
                <tr>
                  <td style={{padding: 0,width: 'calc(100% - 32px)'}}><div style={remarks}>{text ? text : '暂无'}</div></td>
                  <td style={{padding: 0,width: '32px'}}>
                    <Button type="link"
                            icon="form"
                            style={{padding: 0}}
                            onClick={() => this.setState({
                              unionId: record.unionId,
                              showEditModal: true,
                              modalType: 'manager',
                              manager: record.manager ? record.manager : ''
                            })}
                            disabled={!this.allow(137)}
                            title={!this.allow(137) ? '没有该操作权限' : null}
                    /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      },
      {title: '微信号', dataIndex: 'wechatNo', key: 'wechatNo', width: 160,
        render: (text,record) => (
          <div  style={hidden}>
            <table>
              <tbody>
                <tr>
                  <td style={{padding: 0,width: 'calc(100% - 32px)'}}><div style={remarks}>{text ? text : '暂无'}</div></td>
                  <td style={{padding: 0,width: '32px'}}>
                    <Button type="link"
                            icon="form"
                            style={{padding: 0}}
                            onClick={() => this.setState({
                              unionId: record.unionId,
                              showEditModal: true,
                              modalType: 'wechatNo',
                              wechatNo: record.wechatNo ? record.wechatNo : ''
                            })}
                            disabled={!this.allow(137)}
                            title={!this.allow(137) ? '没有该操作权限' : null}
                    /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      },
      {title: '销售备注', dataIndex: 'note', key: 'note',
        render: (text,record) => (
          <div style={hidden}>
            <table>
              <tbody>
                <tr>
                  <td style={{padding: 0,width: 'calc(100% - 32px)'}}><div style={remarks}>{text ? text : '暂无'}</div></td>
                  <td style={{padding: 0,width: '32px'}}>
                    <Button type="link"
                            icon="form"
                            style={{padding: 0}}
                            onClick={() => this.setState({
                              unionId: record.unionId,
                              showEditModal: true,
                              modalType: 'saleNote',
                              saleNote: record.note ? record.note : ''
                            })}
                            disabled={!this.allow(137)}
                            title={!this.allow(137) ? '没有该操作权限' : null}
                  /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )},
      {title: '用户标签', dataIndex: '用户标签', key: '用户标签', width: 160,
        render: (text, record) => (
          <div>
            {record.legworkInfoVo.reservationTotal &&
              // <div>跑腿: {record.legworkInfoVo.reservationTotal} 次</div>
              <div style={tabsStyle}>跑腿</div>
            }
            {record.rebateInfoVo &&
              <div style={tabsStyle}>返点</div>
            }
            {(record.transferInfoVo.receptionTotal || record.transferInfoVo.sendTotal) &&
              <div style={tabsStyle}>接送机</div>
            }
            {(record.logisticsInfoVo.sktTotal || record.logisticsInfoVo.bcTotal || record.logisticsInfoVo.etkTotal || record.logisticsInfoVo.postalTotal || record.logisticsInfoVo.globalTotal) &&
              <div style={tabsStyle}>物流</div>
            }
          </div>
        )
      },
      {title: '操作', dataIndex: '操作', key: '操作', width: 100, fixed: 'right',
        render: (text, record) =>
          <div>
            <Button type="primary"
                    onClick={this.showDetails.bind(this, record)}
            >查看</Button>
          </div>
      },
    ];
    const { Search } = Input;
    const {tableDataList, pageTotal, pageSize, pageNum, pageSizeOptions, tableLoading, parm, modalLoading, showEditModal, modalType, manager, saleNote, phoneNum, wechatNo} = this.state;
    return (
      <div className="orderManage contentMain">
        <div className="title">
          <div className="titleMain">客户信息表</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <Search placeholder="请输入关键字进行搜索"
                  style={{width: 200}}
                  onSearch={this.getCustomerInfoList.bind(this)}
                  value={parm}
                  onChange={e => this.setState({parm: e.target.value})}
          />
        </div>

        {/*弹窗*/}
        <Modal title={(() => {
                 if (modalType === 'manager') {
                   return '修改跟进人'
                 } else if (modalType === 'saleNote') {
                   return '修改销售备注'
                 } else if (modalType === 'phoneNum') {
                   return '修改手机号'
                 } else if (modalType === 'wechatNo'){
                   return '修改微信号'
                 }})()}
               visible={showEditModal}
               width={400}
               confirmLoading={modalLoading}
               onCancel={() => this.setState({showEditModal: false})}
               onOk={this.editSaleInfoByUnionId.bind(this)}
        >
          {modalType === 'phoneNum' && <Input value={phoneNum}
                                             onChange={e => this.setState({phoneNum: e.target.value})}
          />}
          {modalType === 'manager' && <Input value={manager}
                                             onChange={e => this.setState({manager: e.target.value})}
          />}
          {modalType === 'saleNote' && <Input.TextArea value={saleNote}
                                                       onChange={e => this.setState({saleNote: e.target.value})}
          />}
          {modalType === 'wechatNo' && <Input value={wechatNo}
                                             onChange={e => this.setState({wechatNo: e.target.value})}
          />}
        </Modal>

        <div className="tableMain"
             style={{maxWidth: 1200}}
        >
          <Table id="table"
                 className="tableList"
                 columns={columns}
                 dataSource={tableDataList}
                 bordered
                 rowKey={(record, index) => `${index}`}
                 scroll={{ y: 550, x: 860 }}
                 pagination={false}
                 loading={tableLoading}
          />
          <Pagination className="tablePagination"
                      total={pageTotal}
                      pageSize={pageSize}
                      current={pageNum}
                      showTotal={(total, range) =>
                        `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 `}共 ${total} 条记录`}
                      onChange={this.changePage.bind(this)}
                      showSizeChanger
                      pageSizeOptions={pageSizeOptions}
                      onShowSizeChange={this.changePage.bind(this)}
          />
        </div>
      </div>
    )
  }
}

export default customerInfo;