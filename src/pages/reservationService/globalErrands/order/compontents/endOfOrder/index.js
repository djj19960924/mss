import React from "react";
import moment from "moment";
// import XLSX from 'xlsx';
import {Table, message, Pagination,Input,Button} from "antd";
import "./index.less";

class EndOfOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      orderNum: 0,
      pageNum: 1,
      pageSize: 50,
      pageSizeOptions:["50","100","500","1000"],
      dataSource: [],
      tableLoading: false
    };

  }

  componentWillMount() {
    this.getOrderInfo();
  }

  //获取表格信息
  getOrderInfo(pageNum = this.state.pageNum, pageSize = this.state.pageSize,searchParm=this.state.searchParm) {
    let data = {
      isEnd: 1,
      pageNum: pageNum,
      pageSize: pageSize,
      searchParm: searchParm
    };
    this.setState({tableLoading: true});
    fetch(window.apiUrl + "/legworkBackend/getLegworkByIsEnd", {
      method: "post",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        this.setState({tableLoading: false});
        if (res.status === 10000) {
          message.success(res.msg);
          this.setState({dataSource: res.data.list, orderNum: res.data.total})
          if (res.data.total > this.state.pageSizeOptions[this.state.pageSizeOptions.length-1]) {
            let pageSizeOptions=this.state.pageSizeOptions;
            pageSizeOptions.push([res.data.total].toString());
            this.setState({pageSizeOptions:pageSizeOptions})
          }
        } else if (res.status === 10004) {
          message.warn(res.msg);
          this.setState({dataSource: [],orderTotal:0});
        } else {
          message.error(res.msg);
          this.setState({dataSource: [],orderTotal:0});
        }
      }
    ).catch(r => {
      this.setState({tableLoading: false});
      console.error(r);
      console.log('前端接口调取错误')
    })
  }

//改变pageNum,pageSize
  changePage(pageNum, pageSize) {
    this.setState({pageNum:pageNum,pageSize:pageSize},()=>{
      this.getOrderInfo(pageNum, pageSize);
    })

  }
  //导出
  // exportInfo() {
  //   let elt = document.getElementById('exportTable');
  //   let wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
  //   XLSX.writeFile(wb, `采购信息 ${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.xlsx`);
  // }
  render() {
    const columns = [
      {
        title: "进度详情",
        dataIndex: "id",
        key: "id",
        width: 150,
        render: (text, record) => (
          <Button type={"primary"} onClick={()=>{this.props.history.push("/reservation-service/global-errands/edit-progress?id=" + record.id+"&contentType=1");}}>查看</Button>
        )
      },
      {
        title: "最近进度更新时间",
        dataIndex: "updateTime",
        key: "updateTime",
        width: 150,
        render: (text, record) => (
          <div>{record.updateTime ? moment(record.updateTime).format("YYYY-MM-DD HH:mm:ss") : "暂无更新时间"}</div>
        )
      },
      {
        title: "最新更新进度",
        dataIndex: "scheduleInfo",
        key: "scheduleInfo",
        width: 150,
        render: (text, record) => (
          <div>{record.scheduleInfo ? record.scheduleInfo : "暂无进度"}</div>
        )
      },
      {
        title: "预订时间",
        dataIndex: "createTime",
        key: "createTime",
        width: 150,
        render: (text, record) => (
          <div>{record.createTime ? moment(record.createTime).format("YYYY-MM-DD HH:mm:ss") : ""}</div>
        )
      },
      {
        title: "跟进人",
        dataIndex: "followUper",
        key: "followUper",
        width: 300,
        render: (text, record) => (
          <div>
            {record.followUper !== null &&
            <span style={{"color": "#FF5406", "marginRight": 10}}>{record.followUper}</span>}
            {record.followUper === null && <span style={{"marginRight": 10}}>暂无跟进人</span>}
          </div>
        )
      },
      {
        title: "微信号",
        dataIndex: "wechatNo",
        key: "wechatNo",
        width: 150
      },
      {
        title: "商品内容",
        dataIndex: "productName",
        key: "productName",
        width: 150
      },
      {
        title: "订单状态",
        dataIndex: "choice",
        key: "choice",
        width: 150,
        render: (text, record) => (
          <div>{record.choice===0 ? "退款" : "完结"}</div>
        )
      }
    ];
    const {dataSource, tableLoading, pageSize, pageNum, pageSizeOptions, orderNum} = this.state;
    const Search=Input.Search;
    return (
      <div className="end-order">
        {/*<Button type={"primary"} disabled={dataSource.length === 0} style={{"marginLeft": 10}}*/}
                {/*onClick={this.exportInfo.bind(this)}>导出等待采购信息</Button>*/}
        <Search  className="searchInput btnLine" placeholder="输入关键字搜索"  onSearch={value => {this.getOrderInfo(undefined,undefined,value);this.setState({searchParm:value})}} />
        <div className="tableMain">
          <Table className="tableList"
                 bordered
                 columns={columns}
                 dataSource={dataSource}
                 loading={tableLoading}
                 rowKey={(record, index) => `${record.id}`}
                 pagination={false}
                 scroll={{x: 1080, y: 600}}
          />
          <Pagination className="tablePagination"
                      current={pageNum}
                      pageSize={pageSize}
                      pageSizeOptions={pageSizeOptions}
                      total={orderNum}
                      showSizeChanger
                      showTotal={(total, range) => `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 `}共 ${total} 条记录`}
                      style={{float: 'right', marginRight: 20, marginTop: 10,marginBottom:20}}
                      onChange={this.changePage.bind(this)}
                      onShowSizeChange={this.changePage.bind(this)}
          />
        </div>

      </div>
    );
  }
}


export default EndOfOrder;