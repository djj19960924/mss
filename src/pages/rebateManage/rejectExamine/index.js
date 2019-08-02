import React from 'react';
import {Select, Table, message, Pagination, Button, Icon, Modal} from 'antd';
import moment from 'moment';
import './index.less';

class rejectExamine extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      pageNum: 1,
      pageSize: 100,
      pageSizeOptions: ['50', '100', '200', '300'],
      //总条数
      pageTotal: 0,
      //table数据
      dataSource: [],
    };
  }
  componentDidMount() {
    this.rejectByMall();
  }
  //根据商场获取驳回小票
  rejectByMall() {
    const {pageNum, pageSize} = this.state;
    this.ajax.post('/recipt/getReciptOfRejected', {
      pageNum: pageNum,
      pageSize: pageSize
    }).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({dataSource: data.list, pageTotal: data.total});
      } else if (r.data.status < 10000) {
        this.setState({dataSource: [], pageTotal: 0});
      }
      r.showError();
    }).catch(r => {
      this.ajax.isReturnLogin(r, this);
    });
  }
  // 改页
  changePage(pageNum,pageSize) {
    this.setState({pageNum:pageNum, pageSize: pageSize},()=>{
      this.rejectByMall();
    });
  }
  //查看小票
  checkTicket(pictureUrl) {
    Modal.info({
      title: '查看小票图片',
      icon: 'picture',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      width: 500,
      content: (
        <div>
          <img alt={null}
               style={{width:'100%'}}
               src={pictureUrl} />
        </div>
      )
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const columns = [
      {title: '商场名称', dataIndex: 'mallName', key: 'mallName', width: 160},
      {title: '提交时间', dataIndex: 'createTime', key: 'createTime', width: 160,
        render: (text, record) => (  //塞入内容
          <div className="ellipsis">{
            text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''
          }</div>
        ),},
      {title: '处理时间', dataIndex: 'updateTime', key: 'updateTime', width: 160,
        render: (text, record) => (  //塞入内容
          <div className="ellipsis">{
            text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''
          }</div>
        ),},
      {title: '驳回原因', dataIndex: 'note', key: 'note',
        render: (text, record) => (  //塞入内容
          <div
            className="ellipsis">{
            record.note.substr(0, 1) === '0' ? '小票不清晰'
              : (record.note.substr(0, 1) === '1' ? '团号不正确'
                : (record.note.substr(0, 1) === '2' ? '小票重复'
                  : (record.note.substr(0, 1) === '4' ? '小票不完整'
                    : `其他${record.note.substr(1) ? `: ${record.note.substr(1)}` : ''}`
                )))
          }</div>
        ),},
      {title: '操作', dataIndex: 'pictureUrl', key: 'pictureUrl', width: 100,
        render: (text, record) => (  //塞入内容
          <div className="ellipsis">
            <Button type="primary"
                    onClick={this.checkTicket.bind(this, record.pictureUrl)}
                    style={{'margin': 0}}
            >查看</Button>
          </div>
        ),}];
    const {country, mallName, pageTotal, pageSize, pageSizeOptions, pageNum, dataSource} = this.state;
    return (
      <div className="rejectExamine contentMain">
        <div className="title">
          <div className="titleMain">已驳回小票</div>
          <div className="titleLine" />
        </div>
        <div className="tableMain">
          <Table id="table"
                 className="tableList"
                 columns={columns}
                 dataSource={dataSource}
                 bordered
                 rowKey={(record, index) => `${index}`}
                 scroll={{ y: 550, x: 800 }}
                 pagination={false}
          />
          <Pagination className="tablePagination"
                      total={pageTotal}
                      pageSize={pageSize}
                      current={pageNum}
                      showTotal={(total, range) => `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 `}共 ${total} 条记录`}
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

export default rejectExamine;