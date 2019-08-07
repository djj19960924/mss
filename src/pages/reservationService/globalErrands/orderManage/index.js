import React from "react";
import {Table, Pagination} from "antd";
import "./index.less";

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

  changePage(pageNum, pageSize) {
    this.setState({pageNum, pageSize},()=>{
      // refresh table
    });
  }

  render() {
    const {tableDataList, pageTotal, pageSize, pageNum, pageSizeOptions} = this.state;
    const columns = [];
    return (
      <div className="orderManage contentMain">
        <div className="title">
          <div className="titleMain">订单管理</div>
          <div className="titleLine" />
        </div>
        <div className="tableMain">
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