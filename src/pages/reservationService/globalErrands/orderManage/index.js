import React from "react";
import {Table, Pagination, Button, Modal} from "antd";
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
      pageSizeOptions: ['50','100','200','300']
    };
  }
  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    this.getLegworkByIsEnd()
  }

  getLegworkByIsEnd() {
    const {pageNum, pageSize} = this.state;
    const showLoading = Is => this.setState({tableLoading: Is});
    showLoading(true);
    const data = {pageNum, pageSize, isEnd: 0};
    this.ajax.post('/legworkBackend/getLegworkByIsEnd', data).then(r => {
      const {data, status} = r.data;
      const dataObj = {
        tableDataList: data.list,
        pageTotal : data.total
      };
      if (status < 10000) {
        dataObj.pageTotal = 0;
        dataObj.tableDataList = [];
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

  showDetails(record) {
    console.log(record);
    const style = {float:'left',width:'120px',color: '#333', fontWeight: 'bold'},
      hidden = {overflow:'hidden'},
      title = {fontSize: '18px', color: '#000', lineHeight: '28px'},
      imgFloat = {float: 'left', width: 80,height: 80,display: 'block', backgroundColor: 'rgba(0,0,0,.1)', marginBottom: 10};
    Modal.info({
      title: '查看跑腿订单详情',
      icon: 'info-circle',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      width: 500,
      content: (
        <div style={hidden}>
          {/*原数据*/}
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
            <div style={style}>跟进人: </div>{record.followUper ? record.followUper : '无'}
          </div>
          <div style={Object.assign({whiteSpace: 'pre-wrap'},hidden)}>
            <div style={style}>商品信息: </div>{record.productName ? record.productName : '无'}
          </div>
          {/*图片*/}
          <div style={title}>图片:</div>
          <div style={hidden}>
            <img src="" alt="" style={imgFloat}/>
            <img src="" alt="" style={Object.assign({marginLeft: 10}, imgFloat)}/>
            <img src="" alt="" style={Object.assign({marginLeft: 10}, imgFloat)}/>
            <img src="" alt="" style={Object.assign({marginLeft: 10}, imgFloat)}/>
            <img src="" alt="" style={imgFloat}/>
            <img src="" alt="" style={Object.assign({marginLeft: 10}, imgFloat)}/>
            <img src="" alt="" style={Object.assign({marginLeft: 10}, imgFloat)}/>
            <img src="" alt="" style={Object.assign({marginLeft: 10}, imgFloat)}/>
          </div>
        </div>
      )
    })
  }

  changePage(pageNum, pageSize) {
    this.setState({pageNum, pageSize},()=>{
      // refresh table
    });
  }

  render() {
    const {tableDataList, pageTotal, pageSize, pageNum, pageSizeOptions} = this.state;
    const ellipsis = {textOverflow:'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'};
    const columns = [
      {title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160,
        render: timeStamp => (
          <div>{timeStamp ? moment(timeStamp).format(`YYYY-MM-DD HH:mm:ss`) : '无'}</div>
        )
      },
      // {title: '预定时间', dataIndex: 'createTime', key: 'createTime', width: 160,
      //   render: timeStamp => (
      //     <div>{timeStamp ? moment(timeStamp).format(`YYYY-MM-DD HH:mm:ss`) : '无'}</div>
      //   )
      // },
      {title: '跟进人', dataIndex: 'followUper', key: 'followUper',
        render: followUper => (
          <div>{followUper ? followUper : '无'}</div>
        )
      },
      {title: '最新进度', dataIndex: 'scheduleInfo', key: 'scheduleInfo', width: 180,
        render: scheduleInfo => (
          <div style={Object.assign({width: 159}, ellipsis)}
               title={scheduleInfo ? scheduleInfo : '无'}
          >{scheduleInfo ? scheduleInfo : '无'}</div>
        )
      },
      {title: '商品信息', dataIndex: 'productName', key: 'productName', width: 220,
        render: productName => (
          <div style={Object.assign({width: 199}, ellipsis)}
               title={productName}
          >{productName}</div>
        )
      },
      {title: '操作', dataIndex: '操作', key: '操作', width: 170, fixed: 'right',
        render: (text, record) =>
          <div>
            <Button type="primary"
                    onClick={this.showDetails.bind(this, record)}
            >查看</Button>
            <Button type="primary"
                    style={{marginLeft: 10}}
                    // onClick={this.showDetails.bind(this,'detail',record)}
            >编辑</Button>
          </div>
      },
    ];
    return (
      <div className="orderManage contentMain">
        <div className="title">
          <div className="titleMain">订单管理</div>
          <div className="titleLine" />
        </div>
        <div className="tableMain"
             style={{maxWidth: 1000}}
        >
          <Table id="table"
                 className="tableList"
                 columns={columns}
                 dataSource={tableDataList}
                 bordered
                 rowKey={(record, index) => `${index}`}
                 scroll={{ y: 550, x: 800 }}
                 pagination={false}
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