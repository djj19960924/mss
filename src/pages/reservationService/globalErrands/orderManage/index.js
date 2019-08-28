import React from "react";
import {Table, Pagination, Button, Modal, Input, message} from "antd";
import moment from 'moment';
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class orderManage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableDataList: [],
      pageTotal: 0,
      pageSize: 100,
      pageNum: 1,
      pageSizeOptions: ['50','100','200','300'],
      isEnd: -2
    };
  }
  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    this.getLegworkByIsEnd()
  }

  // 查询表单数据
  getLegworkByIsEnd() {
    const {pageNum, pageSize, isEnd} = this.state;
    const showLoading = Is => this.setState({tableLoading: Is});
    showLoading(true);
    const data = {pageNum, pageSize, isEnd};
    this.ajax.post('/legworkBackend/getLegworkByIsEnd', data).then(r => {
      const {data, status} = r.data;
      const dataObj = {};
      if (status === 10000) {
        dataObj.tableDataList = data.list;
        dataObj.pageTotal = data.total;
      } else if (status < 10000) {
        dataObj.tableDataList = [];
        dataObj.pageTotal = 0;
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

  // 详情弹窗
  showDetails(record) {
    const style = {float:'left',width:'120px',color: '#333', fontWeight: 'bold'},
      hidden = {overflow:'hidden'},
      title = {fontSize: '18px', color: '#000', lineHeight: '28px'},
      imgFloat = {overflow: 'hidden',float: 'left', width: 110,display: 'block', backgroundColor: 'rgba(0,0,0,.1)', marginBottom: 10, cursor: 'pointer'};
    const voImg = {float: 'left', width: 60,display: 'block',backgroundColor: 'rgba(0,0,0,.1)'},
      voProductName = {float: 'left', marginLeft: 10};
    Modal.info({
      title: '查看跑腿订单详情',
      icon: 'info-circle',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      width: 500,
      content: (
        <div style={hidden}>
          {/* 原数据 */}
          <div style={title}>原信息:</div>
          <div style={hidden}>
            <div style={style}>预定时间: </div>{record.createTime ?
            moment(record.createTime).format(`YYYY-MM-DD HH:mm:ss`) : '无'}
          </div>
          <div style={hidden}>
            <div style={style}>更新时间: </div>{record.updateTime ?
            moment(record.updateTime).format(`YYYY-MM-DD HH:mm:ss`) : '无'}
          </div>
          <div style={hidden}>
            <div style={style}>微信昵称: </div>{record.nickname ? record.nickname : '无'}
          </div>
          <div style={hidden}>
            <div style={style}>微信号: </div>{record.wechatNo ? record.wechatNo : '无'}
          </div>
          <div style={hidden}>
            <div style={style}>跟进人: </div>{record.followUper ? record.followUper : '无'}
          </div>
          <div style={Object.assign({whiteSpace: 'pre-wrap'},hidden)}>
            <div style={style}>商品信息: </div>{record.productDetail ? record.productDetail : '无'}
          </div>
          {/* 详情 */}
          <div style={title}>商品详情:</div>
          <div style={hidden}>
            {record.legworkProductVos ?
              record.legworkProductVos.map((obj, index) => {
                return (
                  <div style={hidden}
                       key={index}
                  >
                    <img src={obj.imgUrl} alt=""
                         style={voImg}
                    />
                    <div style={voProductName}
                    >{obj.productName} ...数量: {obj.productNum}</div>
                  </div>
                )
              }) : <div style={{color: '#ccc'}}>暂无</div>
            }
          </div>
          {/* 图片 */}
          <div style={title}>图片详情:</div>
          <div style={{color: '#ccc', marginBottom: 10}}>(图片可点击查看详情)</div>
          <div style={hidden}>
            {record.imgList.map((url, index) => {
              if(index < 3) {
                return <img src={url} alt=""
                            key={index}
                            style={(index % 4 === 0) ? imgFloat : Object.assign({marginLeft: 10}, imgFloat)}
                            onClick={this.imgDetail.bind(this, url)}/>
              } else {
                return null;
              }
            })}
          </div>
          <div style={hidden}>
            {record.imgList.map((url, index) => {
              if(3 <= index && index < 6) {
                return <img src={url} alt=""
                            key={index}
                            style={(index % 4 === 0) ? imgFloat : Object.assign({marginLeft: 10}, imgFloat)}
                            onClick={this.imgDetail.bind(this, url)}/>
              } else {
                return null;
              }
            })}
          </div>
          <div style={hidden}>
            {record.imgList.map((url, index) => {
              if(6 <= index) {
                return <img src={url} alt=""
                            key={index}
                            style={(index % 4 === 0) ? imgFloat : Object.assign({marginLeft: 10}, imgFloat)}
                            onClick={this.imgDetail.bind(this, url)}/>
              } else {
                return null;
              }
            })}
          </div>
        </div>
      )
    })
  }

  // 查看图片弹窗
  imgDetail(url) {
    Modal.info({
      title: '查看商品图片',
      icon: 'picture',
      className: 'imgDetail',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      width: 500,
      content: (
        <div>
          <img alt={null}
               style={{width:'100%'}}
               src={url} />
        </div>
      )
    });
  }

  // 编辑详情跳转
  editDetail(record) {
    const {push} = this.props.history;
    // window.localStorage.currentGEOrder = JSON.stringify(record);
    push(`/reservation-service/global-errands/order-manage/edit/?legworkId=${record.legworkId}`);
  }

  // 编辑跟进人弹窗
  updateFollowUper(id, followUper) {
    const data = {id, followUper};
    const updateFollowUper = e => {
      // 去除自动关闭事件
      e = () => {};
      this.ajax.post('/legworkBackend/updateFollowUper', data).then(r => {
        const {msg, status} = r.data;
        if (status === 10000) {
          message.success(msg);
          this.getLegworkByIsEnd();
          modal.destroy();
        };
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    };
    const modal = Modal.confirm({
      title: '编辑跟进人',
      content: <div>
        <Input defaultValue={followUper ? followUper : ''}
               onChange={e => data.followUper = e.target.value}
        />
      </div>,
      onOk: updateFollowUper
    })
  }

  // 换页
  changePage(pageNum, pageSize) {
    this.setState({pageNum, pageSize},()=>{
      this.getLegworkByIsEnd()
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }

  render() {
    const {tableDataList, pageTotal, pageSize, pageNum, pageSizeOptions, tableLoading} = this.state;
    const ellipsis = {textOverflow:'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'};
    const hidden = {overflow: 'hidden'};
    const remarks = {lineHeight: '16px', padding: '8px 0',whiteSpace: 'pre-wrap'};
    const columns = [
      {title: '预定时间', dataIndex: 'createTime', key: 'createTime', width: 160,
        render: timeStamp => (
          <div>{timeStamp ? moment(timeStamp).format(`YYYY-MM-DD HH:mm:ss`) : '无'}</div>
        )
      },
      {title: '微信昵称', dataIndex: 'nickname', key: 'nickname', width: 160,
        render: nickname => (
          <div style={Object.assign({width: 139}, ellipsis)}>{nickname ? nickname : '无'}</div>
        )
      },
      {title: '跟进人', dataIndex: 'followUper', key: 'followUper', width: 160,
        render: (followUper,record) => (
          <div  style={hidden}>
            <table>
              <tbody>
              <tr>
                <td style={{padding: 0,width: 'calc(100% - 32px)'}}><div style={remarks}>{followUper ? followUper : '暂无'}</div></td>
                <td style={{padding: 0,width: '32px'}}>
                  <Button type="link"
                          icon="form"
                          style={{padding: 0}}
                          onClick={this.updateFollowUper.bind(this, record.legworkId, followUper)}
                          disabled={!this.allow(137)}
                          title={!this.allow(137) ? '没有该操作权限' : null}
                  /></td>
              </tr>
              </tbody>
            </table>
          </div>
        )
      },
      {title: '商品信息', dataIndex: 'productDetail', key: 'productDetail', width: 240,
        render: productName => (
          <div style={Object.assign({width: 219}, ellipsis)}
               title={productName}
          >{productName}</div>
        )
      },
      {title: '操作', dataIndex: '操作', key: '操作', width: 171, fixed: 'right',
        render: (text, record) =>
          <div>
            <Button type="primary"
                    onClick={this.showDetails.bind(this, record)}
            >查看</Button>
            <Button type="primary"
                    style={{marginLeft: 10}}
                    onClick={this.editDetail.bind(this, record)}
            >编辑</Button>
          </div>
      },
    ];
    return (
      <div className="orderManage contentMain">
        <div className="title">
          <div className="titleMain">原始订单</div>
          <div className="titleLine" />
        </div>

        <div className="tableMain"
             style={{maxWidth: 920}}
        >
          <Table id="table"
                 className="tableList"
                 columns={columns}
                 dataSource={tableDataList}
                 bordered
                 rowKey={(record, index) => `${index}`}
                 scroll={{ y: 550, x: 890 }}
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

export default orderManage;