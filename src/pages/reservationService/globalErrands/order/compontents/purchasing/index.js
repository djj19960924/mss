import React from "react";
import {Table, Button, message, Modal, Pagination, Input, Radio} from "antd";
import moment from "moment";
import XLSX from 'xlsx';
import {withRouter} from 'react-router-dom';
import "./index.less";

@withRouter
class WaitPurchasing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //订单总量
      orderTotal: 0,
      pageNum: 1,
      pageSize: 50,
      pageSizeOptions: ["50", "100", "200", "300"],
      //表格数据
      dataSource: [],
      //表格加载loading
      tableLoading: false
    };
  }

  componentWillMount() {
    this.getOrderInfo();
  }

  //获取表格数据
  getOrderInfo(pageNum = this.state.pageNum, pageSize = this.state.pageSize, searchParm = this.state.searchParm) {
    let data = {
      pageNum: pageNum,
      pageSize: pageSize,
      searchParm: searchParm
    };
    this.setState({tableLoading: true});
    this.ajax.post('/legworkBackend/getLegworkOrder', data).then(r => {
      const {status, data} = r.data;
      if (status === 10000) {
        this.setState({
          dataSource: data.list,
          orderTotal: data.total,
          pageSizeOptions: ["50", "100", "200", `${data.total > 300 ? data.total : 300}`],
        });
      } else if (status < 10000) {
        this.setState({dataSource: [], orderTotal: 0});
      }
      this.setState({tableLoading: false});
      r.showError();
    }).catch(r => {
      this.setState({tableLoading: false});
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

//改变pageNum,pageSize
  changePage(pageNum, pageSize) {
    this.setState({pageNum: pageNum, pageSize: pageSize}, function () {
      this.getOrderInfo(pageNum, pageSize);
    })
  }

  //导出
  exportInfo() {
    let elt = document.getElementById('exportTable');
    let wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
    XLSX.writeFile(wb, `采购信息 ${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.xlsx`);
  }

  componentWillUnmount() {
    this.setState = () => null
  }

  render() {
    const columns = [
      {
        title: "微信号",
        dataIndex: "wechatNo",
        key: "wechatNo",
        width: 150
      },
      {
        title: "跟进人",
        dataIndex: "followUper",
        key: "followUper",
        width: 200,
        render: (text, record) => (
          <div>
            {record.followUper !== null &&
            <span style={{"color": "#FF5406", "marginRight": 10}}>{record.followUper}</span>}
            {record.followUper === null && <span style={{"marginRight": 10}}>暂无跟进人</span>}
          </div>
        )
      },
      {
        title: "接单买手",
        dataIndex: "userName",
        key: "userName",
        width: 150,
        render: text => (
          <div>{text ? text : "暂未被买手接单"}</div>
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
        title: "预订时间",
        dataIndex: "createTime",
        key: "createTime",
        width: 150,
        render: (text, record) => (
          <div>{record.createTime ? moment(record.createTime).format("YYYY-MM-DD HH:mm:ss") : ""}</div>
        )
      },
      // {
      //   title: "商品内容",
      //   dataIndex: "productDetail",
      //   key: "productDetail"
      // }
      {
        title: "商品内容",
        dataIndex: "legworkProductVos",
        key: "legworkProductVos",
        width: 150,
        render: legworkProductVos => (
          <div>
            {!!legworkProductVos && legworkProductVos.map((obj, index) => (
              <div key={index} style={{marginTop: index !== 0 ? 5 : 0}}>
                商品名{index + 1}:{obj.productName} 数量:{obj.productNum}
              </div>
            ))}
          </div>
        )
      },
    ];
    const exportColumns = [
      {
        title: "预订时间",
        dataIndex: "createTime",
        key: "createTime",
        width: 150,
        render: (text, record) => (
          <div>{moment(record.createTime).format("YYYY-MM-DD HH:mm:ss")}</div>
        )
      },
      {
        title: "微信号",
        dataIndex: "wechatNo",
        key: "wechatNo",
        width: 150
      },
      // {
      //   title: "商品内容",
      //   dataIndex: "productDetail",
      //   key: "productDetail",
      //   width: 150
      // },
      {
        title: "商品内容",
        dataIndex: "legworkProductVos",
        key: "legworkProductVos",
        width: 150,
        render: legworkProductVos => (
          <div>
            {!!legworkProductVos && legworkProductVos.map((obj, index) => (
              <div key={index} style={{marginTop: index !== 0 ? 5 : 0}}>
                商品名{index + 1}:{obj.productName} 数量:{obj.productNum}{`\n`}
              </div>
            ))}
          </div>
        )
      },
      {
        title: "跟进人",
        dataIndex: "followUper",
        key: "followUper",
        width: 250,
      },
      // {
      //   title: "最新更新进度",
      //   dataIndex: "scheduleInfo",
      //   key: "scheduleInfo",
      //   width: 150,
      //   render: (text, record) => (
      //     <div>{record.scheduleInfo ? record.scheduleInfo : "暂无进度"}</div>
      //   )
      // }
    ];
    const {dataSource, tableLoading, pageNum, pageSize, pageSizeOptions, orderTotal} = this.state;
    const Search = Input.Search;
    return (
      <div className="wait-purchasing">
        <div className="btnLine">
          <Button type={"primary"} disabled={dataSource.length === 0} style={{"marginLeft": 10}}
                  onClick={this.exportInfo.bind(this)}>导出等待采购信息</Button>
          <Search className="searchInput" placeholder="输入关键字搜索" onSearch={value => {
            this.getOrderInfo(undefined, undefined, value);
            this.setState({searchParm: value})
          }}/>
        </div>

        {/*导出*/}
        <Table id="exportTable"
               columns={exportColumns}
               dataSource={dataSource}
               pagination={false}
               style={{display: `none`}}
               rowKey={(record, index) => index}
        />
        <div className="purchaseTableMain tableMain">
          <Table className="tableList"
                 bordered
                 columns={columns}
                 dataSource={dataSource}
                 pagination={false}
                 loading={tableLoading}
                 rowKey={(record, index) => `${record.legworkId}`}
                 scroll={{x: 960, y: 500}}
          />
          <Pagination className="tablePagination"
                      current={pageNum}
                      pageSize={pageSize}
                      pageSizeOptions={pageSizeOptions}
                      showSizeChanger
                      showTotal={(total, range) => `${range[1] === 0 ? "" : ` 当前为第${range[0]}-${range[1]}条 `}共${total}条记录`}
                      style={{float: 'right', marginRight: 20, marginTop: 10, marginBottom: 20}}
                      total={orderTotal}
                      onChange={this.changePage.bind(this)}
                      onShowSizeChange={this.changePage.bind(this)}
          />
        </div>
      </div>
    );
  }
}


export default WaitPurchasing;