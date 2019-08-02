import React from 'react';
import {Table, Pagination, Select, Input, Button, message,} from 'antd';
import moment from 'moment';
import './index.less';

class adoptExaminePaid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      payment: null,
      searchValue: ``,
      pageNum: 1,
      pageSize: 100,
      pageTotal: 0,
      pageSizeOptions: ['50', '100', '200', '300'],
      tableIsLoading: false,
    };
  }

  componentDidMount() {
    this.getProgramUserPaied()
  }

  // 获取已打款信息
  getProgramUserPaied() {
    const {searchValue, pageNum, pageSize, payment} = this.state;
    this.setState({tableIsLoading:true});
    let dataObj = {
      payWay: payment,
      pageNum: pageNum,
      pageSize: pageSize
    };
    switch (payment) {
      case 1:
        dataObj.cardNo = searchValue;
        break;
      case 2:
        dataObj.alipayNo = searchValue;
        break;
      case 3:
        dataObj.wechatNo = searchValue;
        break;
      default:
        dataObj.wechatName = searchValue;
    }
    this.ajax.post('/programUser/getAllReciptAccount',dataObj).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          dataList: data.list,
          pageTotal: data.total,
        })
      } else if (r.data.status < 10000) {
        this.setState({
          dataList: [],
          pageTotal: 0
        })
      }
      this.setState({tableIsLoading:false});
      r.showError();
    }).catch(r => {
      this.setState({tableIsLoading:false});
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 翻页事件
  changePage(pageNum, pageSize) {
    this.setState({
      pageNum:pageNum,
      pageSize:pageSize
    },() => {
      this.getProgramUserPaied()
    })
  }

  // 根据收款账号类型显示
  accountType(record) {
    switch (record.payWay) {
      case 0: return `余额`;
      case 1: return `银行卡号： ${record.cardNo}`;
      case 2: return `支付宝账号： ${record.alipayNo}`;
      case 3: return `微信号： ${record.wechatNo}`;
      default: return `未知支付方式`;
    }
  }

  // 改变支付方式
  changePayment(v) {
    this.setState({payment: v, searchValue: ``, pageNum: 1, pageSize: 100}, () => {
      this.getProgramUserPaied();
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const Option = Select.Option;
    const columns = [
      {title: '申请人', dataIndex: 'wechatName', key: 'wechatName'},
      {title: '收款账户', dataIndex: 'account', key: 'account', width: 260,
        render: (text, record) => (
          <div>{this.accountType(record)}</div>
        )
      },
      {title: '到账金额', dataIndex: 'payMoney', key: 'payMoney', width: 150},
      {
        title: '到账时间', dataIndex: 'updateTime', key: 'updateTime', width: 200,
        render: (text, record) => (  //塞入内容
          <div>{record.createTime ? moment(record.createTime).format('YYYY-MM-DD HH:mm:ss') : `数据错误`}</div>
        ),
      }
    ];
    const {dataList, pageSizeOptions, pageTotal, pageSize, pageNum, payment, searchValue, tableIsLoading} = this.state;
    return (
      <div className="adoptExaminePaid contentMain">
        <div className="title">
          <div className="titleMain">已返款</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          {/*支付方式*/}
          <span>支付方式：</span>
          <Select className="selectPayment"
                  value={payment}
                  style={{width: 100}}
                  onChange={this.changePayment.bind(this)}
          >
            <Option value={null}>全部</Option>
            <Option value={0}>余额</Option>
            <Option value={1}>银行卡</Option>
            <Option value={2}>支付宝</Option>
            <Option value={3}>微信</Option>
          </Select>
          {/*模糊查询条件*/}
          {
            payment !== 0 &&
            <div>
              <span style={{marginLeft: 16}}>{`输入${
                payment === null ? `微信昵称` :
                  (payment === 1 ? `银行卡号` :
                    (payment === 2 ? `支付宝账号` : `微信号`))
                }查询:`}</span>
              <Input className="searchValue"
                     placeholder={`请输入${
                       payment === null ? `微信昵称` :
                         (payment === 1 ? `银行卡号` :
                           (payment === 2 ? `支付宝账号` : `微信号`))
                       }`}
                     value={searchValue}
                     style={{width: 160, marginLeft: 10}}
                     onChange={(e) => this.setState({searchValue: e.target.value})}
              />
              <Button type="primary"
                      style={{marginLeft: 10}}
                      onClick={this.getProgramUserPaied.bind(this)}
              >搜索</Button>
            </div>
          }

        </div>
        <div className="tableMain"
             style={{maxWidth:1000}}
        >
          <Table className="tableList"
                 loading={tableIsLoading}
                 dataSource={dataList}
                 columns={columns}
                 pagination={false}
                 bordered
                 scroll={{y: 600}}
                 rowKey={(record, index) => `id_${index}`}
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

export default adoptExaminePaid;