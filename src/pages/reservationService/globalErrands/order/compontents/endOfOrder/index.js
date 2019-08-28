import React from "react";
import moment from "moment";
import {Table, message, Pagination,Input,Button,Modal} from "antd";
import "./index.less";

class EndOfOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      orderNum: 0,
      pageNum: 1,
      pageSize: 50,
      pageSizeOptions:["50","100","200","300"],
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
      isEnd: 2,
      pageNum: pageNum,
      pageSize: pageSize,
      searchParm: searchParm
    };
    this.setState({tableLoading: true});
    this.ajax.post('/legworkBackend/getLegworkByIsEnd', data).then(r => {
      const {status, data, msg} = r.data;
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

  addTrackNo(id) {
    const data = {id, trackNo: ''};
    const updateTrackNo = () => {
      this.ajax.post('/legwork/updateTrackNo', data).then(r => {
        const {status, msg} = r.data;
        if (status === 10000) {
          message.success(msg);
          this.getOrderInfo();
        }
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    };
    Modal.confirm({
      title: '添加物流单号',
      icon: 'upload',
      content: <div>
        <Input onChange={e => data.trackNo = e.target.value}
        />
      </div>,
      onOk: updateTrackNo
    })
  }

//改变pageNum,pageSize
  changePage(pageNum, pageSize) {
    this.setState({pageNum:pageNum,pageSize:pageSize},()=>{
      this.getOrderInfo(pageNum, pageSize);
    })

  }


  componentWillUnmount() {
    this.setState = () => null
  }

  render() {
    const columns = [
      {
        title: "操作",
        dataIndex: "legworkId",
        key: "legworkId",
        width: 150,
        render: text => (
          <div>
            <Button type={"primary"} onClick={()=>{
              this.props.history.push("/reservation-service/global-errands/order/edit-progress?id=" + text +"&contentType=1")}
            }>查看进度</Button>
            <Button type="default"
                    style={{marginTop: 8}}
                    onClick={this.addTrackNo.bind(this, text)}
            >添加物流单号</Button>
          </div>
        )
      },
      {
        title: "物流单号",
        dataIndex: "trackNo",
        key: "trackNo",
        width: 150,
        render: trackNo => (
          <div>{trackNo ? trackNo : "暂无物流单号"}</div>
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
      // {
      //   title: "预订时间",
      //   dataIndex: "createTime",
      //   key: "createTime",
      //   width: 150,
      //   render: (text, record) => (
      //     <div>{record.createTime ? moment(record.createTime).format("YYYY-MM-DD HH:mm:ss") : ""}</div>
      //   )
      // },
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
        title: "微信号",
        dataIndex: "wechatNo",
        key: "wechatNo",
        width: 150
      },
      {
        title: "商品内容",
        dataIndex: "productDetail",
        key: "productDetail",
        width: 150
      },
      // {
      //   title: "订单状态",
      //   dataIndex: "choice",
      //   key: "choice",
      //   width: 150,
      //   render: (text, record) => (
      //     <div>{record.choice===0 ? "退款" : "完结"}</div>
      //   )
      // }
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
                 rowKey={(record, index) => index}
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