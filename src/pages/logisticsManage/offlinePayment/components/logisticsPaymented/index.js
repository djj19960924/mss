import React from "react";
import {Table, message, Pagination,} from "antd";
import moment from "moment";
import { withRouter } from 'react-router-dom';

import './index.less';

@withRouter
class LogisticsPaymented extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pageNum: 1,
      pageSize: 50,
      dataSource: [],
      //总条数
      total: 0,
      tableLoading: false,
      pageSizeOptions: ["50", "200", "500", "1000"],
    };

  }

  componentDidMount() {
    this.getPaymented();
  }

  changePage(pageNum, pageSize) {
    this.getPaymented(pageNum, pageSize);
    this.setState({pageNum: pageNum, pageSize: pageSize})
  }

  getPaymented(pageNum = this.state.pageNum, pageSize = this.state.pageSize) {
    const {pageSizeOptions}=this.state;
    this.setState({tableLoading: true});
    this.ajax.post("/backend/speedexpress/getOffLine",{pageNum: pageNum, pageSize: pageSize, isPay: 1}).then(res=>{
      this.setState({tableLoading: false});
      if (res.data.status === 10000) {
        if(res.data.data.total>pageSizeOptions[pageSizeOptions.length-1]){
          pageSizeOptions.push(res.data.data.total);
        }
        this.setState({dataSource: res.data.data.list, total: res.data.data.total});
      }else if(res.data.status < 10000){
        this.setState({dataSource:[], total: 0});
      }
      res.showError(true);
    }).catch(res => {
      this.setState({tableIsLoading:false});
      this.ajax.isReturnLogin(res, this);
    });
  }

  //转换支付方式
  exchangePayment(value) {
    switch (value) {
      case 0 :
        return "支付宝";
      case 1:
        return "银行卡";
      case  2:
        return "微信";
      case  3:
        return "现金";
      default:
        return "支付方式错误";
    }
  }

  render() {
    const columns = [{
      title: "订单时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 150,
      render: (text, record) => (
        <div>{record.createTime ? moment(record.createTime).format("YYYY-MM-DD HH:mm:ss") : ""}</div>
      )
    }, {
      title: "业务类型",
      dataIndex: "offLineType",
      key: "offLineType",
      width: 150,
      render: (text, record) => (
        <div>{record.offLineType === 0 ? "邮路/ETK" : (record.offLineType === 1 ? "BC" : "速跨通")}</div>
      )
    }, {
      title: "订单号/箱号",
      dataIndex: "code",
      key: "code",
    }, {
      title: "用户昵称",
      dataIndex: "nickName",
      key: "nickName",
      width: 200
    }, {
      title: "需支付金额",
      dataIndex: "payMoney",
      key: "payMoney",
      width: 150
    }, {
      title: "支付方式",
      dataIndex: "payType",
      key: "payType",
      width: 150,
      render: (text, record) => (
        <div>{this.exchangePayment(record.payType)}</div>
      )
    }
    ];
    const {dataSource, pageSize, pageNum, pageSizeOptions, total} = this.state;
    return (
      <div className="logistics-paymented">
        <div className="tableMain">
          <Table className="tableList"
                 columns={columns}
                 dataSource={dataSource}
                 bordered
                 pagination={false}
                 rowKey={(record, index) => `${record.code}`}
                 scroll={{x: 1080, y: 600}}/>
          <Pagination current={pageNum}
                      pageSize={pageSize}
                      pageSizeOptions={pageSizeOptions}
                      showSizeChanger
                      total={total}
                      showTotal={(total, range) => `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 `}共 ${total} 条记录`}
                      style={{float: 'right', marginRight: '20px', marginTop: '10px', marginBottom: '10px'}}
                      onChange={this.changePage.bind(this)}
                      onShowSizeChange={this.changePage.bind(this)}/>
        </div>
      </div>
    );
  }
}


export default LogisticsPaymented;