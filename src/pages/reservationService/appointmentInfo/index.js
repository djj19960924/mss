import React from 'react';
import { Table, Pagination } from 'antd';
import moment from 'moment';
import './index.less';

class appointmentInfo extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      tableDataList: [],
      // 分页
      pageTotal: 0,
      pageSize: 30,
      pageSizeOptions: ['30','50','80','100'],
      pageNum: 1,
      // 表单加载
      tableIsLoading: false,
    };
  }
  componentDidMount() {
    this.getAppointmentList();
  }
  getAppointmentList() {
    const { pageNum, pageSize } = this.state;
    const dataObj = {pageNum:pageNum,pageSize:pageSize};
    this.setState({tableIsLoading: true});
    this.ajax.post('/appointment/getAppointmentList',dataObj).then(r => {
      if (r.data.status === 10000) {
        const { data } = r.data;
        this.setState({tableDataList:data.list,pageTotal: data.total});
      }
      this.setState({tableIsLoading: false});
      r.showError();
    }).catch(r => {
      this.setState({tableIsLoading: false});
      this.ajax.isReturnLogin(r,this);
    });
  }
  // 翻页事件
  changePage(pageNum,pageSize) {
    this.setState({pageNum:pageNum,pageSize:pageSize},() => {
      this.getAppointmentList();
    });
  }
  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const columns = [
      { title: '预约时间', dataIndex: 'expectTime', key: 'expectTime', width: 160,
        render: (text, record) => (
          <div>{text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''}</div>
        )
      },
      { title: '预约件数', dataIndex: 'expectNumber', key: 'expectNumber', width: 80, },
      { title: '航班号', dataIndex: 'flightNumber', key: 'flightNumber', width: 80, },
      { title: '仓库名称', dataIndex: 'warehouseName', key: 'warehouseName' },
      // { title: '用户名(预约人)', title: '用户名', dataIndex: 'nickName', key: 'nickName', width: 100, },
      { title: '服务区域类型', dataIndex: 'packArea', key: 'packArea', width: 120, },
      { title: '附近商场', dataIndex: 'shop', key: 'shop', width: 140, },
      { title: '用户手机号', dataIndex: 'userPhone', key: 'userPhone', width: 120, },
      { title: '是否打包', dataIndex: 'isPack', key: 'isPack', width: 70,
        render: (text, record) => (  //塞入内容
          <div>{record.isPack===1 ? "是":(record.isPack===0 ? "否":"")}</div>
        ),
      }];
    const { tableDataList, tableIsLoading, pageTotal, pageSize, pageNum, pageSizeOptions } = this.state;
    return (
      <div className="appointmentInfo contentMain">
        <div className="title">
          <div className="titleMain">预约上门打包</div>
          <div className="titleLine" />
        </div>
        <div className="tableMain">
          <Table className="tableList"
                 dataSource={tableDataList}
                 columns={columns}
                 pagination={false}
                 bordered
                 scroll={{ x:1100, y: 500 }}
                 rowKey={(record, index) => `id_${index}`}
                 loading={tableIsLoading}
          />
          <Pagination className="tablePagination"
                      total={pageTotal}
                      pageSize={pageSize}
                      current={pageNum}
                      showTotal={(total, range) => `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 ` }共 ${total} 条记录`}
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

export default appointmentInfo;