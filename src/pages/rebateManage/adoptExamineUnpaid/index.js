import React from 'react';
import {Button, Table, Icon, message, Pagination, Select, Modal} from 'antd';
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class adoptExamineUnpaid extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      dataSource:[],
      payment: 2,
      pageNum: 1,
      pageSize: 100,
      pageTotal: 0,
      pageSizeOptions: ['50', '100', '200', '300'],
      tableIsLoading: false,
      makeMoneyIsLoading: false,
    };
  }
  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    this.getTableList();
  }
  // 获取列表
  getProgramUserNotPayList() {
    const {payment, pageNum, pageSize} = this.state;
    const data = {payment: payment, pageNum: pageNum, pageSize: pageSize};
    this.setState({tableIsLoading:true});
    this.ajax.post('/programUser/getProgramUserNotPayList', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          dataSource: data.list,
          pageTotal: data.total
        })
      } else if (r.data.status < 10000) {
        this.setState({
          dataSource:[],
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
  getTableList() {
    const {payment} = this.state;
    if (payment === null) {
      this.getProgramUserNoPayment();
    } else {
      this.getProgramUserNotPayList();
    }
  }
  getProgramUserNoPayment() {
    const {pageNum, pageSize} = this.state;
    this.setState({tableIsLoading:true});
    const data = {
      pageNum: pageNum,
      pageSize: pageSize
    };
    this.ajax.post('/programUser/getProgramUserNoPayment', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          dataSource: data.list,
          pageTotal: data.total
        })
      } else if (r.data.status < 10000) {
        this.setState({
          dataSource:[],
          pageTotal: 0
        })
      }
      r.showError();
      this.setState({tableIsLoading:false});
    }).catch(r => {
      this.setState({tableIsLoading:false});
      this.ajax.isReturnLogin(r, this);
    });
  }
  changePayment(v) {
    this.setState({payment: v},() => {
      this.getTableList();
    });
  }
  // 翻页事件
  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize
    }, () => {
      this.getTableList()
    })
  }


  makeMoney(record) {
    const {payment, makeMoneyIsLoading} = this.state;
    const style = {float:'left',width:'80px'}, hidden = {overflow:'hidden'};
    Modal.confirm({
      title: '确认打款信息',
      content: <div>
        {payment === 1 && <div>
          <div style={hidden}><div style={style}>持卡人: </div>{record.userName}</div>
          <div style={hidden}><div style={style}>银行卡号: </div>{record.cardNo}</div>
          <div style={hidden}><div style={style}>开户行: </div>{record.openingBank}</div>
        </div>}
        {payment === 2 && <div>
          <div style={hidden}><div style={style}>支付宝名称: </div>{record.alipayName}</div>
          <div style={hidden}><div style={style}>支付宝账号: </div>{record.alipayNo}</div>
        </div>}
        {payment === 3 && <div>
          <div style={hidden}><div style={style}>微信名称: </div>{record.wechatName}</div>
          <div style={hidden}><div style={style}>微信账号: </div>{record.wechatNo}</div>
        </div>}
        <div style={hidden}><div style={style}>应付金额: </div>{(record.returningMoney * 0.99).toFixed(2)}</div>
      </div>,
      icon: 'pay-circle',
      okText: '确认已打款',
      maskClosable: true,
      okButtonProps: {
        loading: makeMoneyIsLoading
      },
      onOk: () => {
        this.setState({makeMoneyIsLoading: true});
        const data = {
          returnedMoney: record.returnedMoney,
          returningMoney: record.returningMoney,
          unionId: record.unionId
        };
        this.ajax.post('/programUser/updatePayAndReciptByUnionId', data).then(r => {
          if (r.data.status === 10000) {
            message.success(r.data.msg);
            this.getTableList();
          }
          r.showError();
          this.setState({makeMoneyIsLoading: false});
        }).catch(r => {
          this.setState({makeMoneyIsLoading: false});
          this.ajax.isReturnLogin(r, this);
        });
      }
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const {pageSizeOptions, tableIsLoading, payment, dataSource, pageTotal, pageSize, pageNum, makeMoneyIsLoading} = this.state;
    const columns=[
      {title: '申请人',dataIndex: 'wechatName',key: 'wechatName'},
      {title: '申请金额',dataIndex: 'returningMoney',key: 'returningMoney',width: 150},
      {title: '应付金额',dataIndex: 'returningMoney2',key: 'returningMoney2',width: 150,
        render: (text, record) => (  //塞入内容
          <div className={"ellipsis"} >{(record.returningMoney*0.99).toFixed(2)}</div>
        ),
      }];
    const columnsAdd = {
      title: '操作', dataIndex: 'operation', key: 'operation', width: 100,
      render: (text, record) => (  //塞入内容
        <div className={record.payment ? "ellipsis" : 'unShow'}>
          <Button type="primary"
                  onClick={this.allow(80) ? this.makeMoney.bind(this, record) : null}
                  style={{'margin': 0}}
                  disabled={!this.allow(80)}
                  title={!this.allow(80) ? '没有该操作权限' : null}
                  loading={makeMoneyIsLoading}
          >打款</Button>
        </div>
      ),
    };
    if (payment !== null) columns.push(columnsAdd);
    const {Option} = Select;
    return (
      <div className="adoptExamineUnpaid contentMain">
        <div className="title">
          <div className="titleMain">待返款</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          {/*提现方式*/}
          <span>提现方式：</span>
          <Select className="selectPayment"
                  value={payment}
                  style={{width: 100}}
                  onChange={this.changePayment.bind(this)}
          >
            <Option value={null}>未设置</Option>
            <Option value={1}>银行卡</Option>
            <Option value={2}>支付宝</Option>
            <Option value={3}>微信</Option>
          </Select>
        </div>

        <div className="tableMain"
             style={{maxWidth:800}}
        >
          <Table  id="table"
                  loading={tableIsLoading}
                  className="tableList"
                  columns={columns}
                  dataSource={dataSource}
                  bordered
                  scroll={{ y: 600 }}
                  rowKey={(record, index) => `id:${record.boxCode}${index}`}
                  pagination={false}
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

export default adoptExamineUnpaid;