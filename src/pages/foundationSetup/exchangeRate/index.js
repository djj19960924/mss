import React from "react";
import {Table, Button, Modal, message, Input} from "antd";
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class ExchangeRate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableList: [],
      editRateVisible: false,
      //使用币种
      currency: null,
      //兑换币种
      rateCurrency: null,
      //当前选择的汇率
      rate: null,
      //汇率Id
      rateId: null,
      //编辑确定loading
      editConfirmLoading: false,
      //表格加载
      tableLoading: false
    };
  }
  allow = this.props.appStore.getAllow.bind(this);
  componentDidMount() {
    this.getRateList();
  }
  // 获取汇率列表
  getRateList() {
    const showLoading = Is => this.setState({tableLoading: Is});
    showLoading(true);
    this.ajax.post('/backendRate/getRateList').then(r => {
      if (r.data.status === 10000) {
        this.setState({tableList: r.data.data})
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }
  // 修改汇率
  updateRate() {
    const {rateId, rate} = this.state;
    const showLoading = Is => this.setState({editConfirmLoading: Is});
    showLoading(true);
    const data = {id: rateId, rate: rate};
    this.ajax.post('/backendRate/updateRate', data).then(r => {
      if (r.data.status === 10000) {
        message.success(r.data.msg);
        this.setState({currency: "", rateCurrency: "", rate: "", rateId: "", editRateVisible: false})
        this.getRateList();
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  render() {
    const columns = [
      {title: "使用币种",dataIndex: "currency",key: "currency",width: 120},
      {title: "兑换币种",dataIndex: "rateCurrency",key: "rateCurrency",width: 120},
      {title: "汇率",dataIndex: "rate",key: "rate",width: 100},
      {title: "编辑",dataIndex: "currencyId",key: "currencyId",width: 100,
        render: (text, record) => <div>
          <Button type="primary"
                  onClick={() => {
                    if (text !== 3) this.setState({
                      editRateVisible: true,
                      currency: record.currency,
                      rateCurrency: text,
                      rate: record.rate,
                      rateId: record.id
                    })
                  }}
                  // 当 currencyId 为 3 时, 表示人民币汇率
                  // 不可修改同汇率比例, 恒定为1
                  disabled={text === 3 || !this.allow(104)}
                  title={text === 3 ? '人民币汇率恒定为1' : (!this.allow(104) ? '无该操作权限' : null)}
          >编辑</Button>
        </div>
    }];
    const {tableList, editRateVisible, currency, rateCurrency, rate,editConfirmLoading,tableLoading} = this.state;
    return (
      <div className="exchange-rate contentMain">
        <div className="title">
          <div className="titleMain">汇率</div>
          <div className="titleLine"/>
        </div>
        <div className="tableMain"
             style={{maxWidth: 600, paddingTop: 10}}
        >
          <Table className="tableList"
                 bordered
                 dataSource={tableList}
                 columns={columns}
                 loading={tableLoading}
                 pagination={false}
                 scroll={{x: 550, y: 500}}
                 rowKey={(record, index) => index}/>
        </div>

        <Modal title="是否修改汇率"
               closable={false}
               destroyOnClose
               width={300}
               confirmLoading={editConfirmLoading}
               visible={editRateVisible}
               wrapClassName="exchange-rate-modal"
               onOk={this.updateRate.bind(this)}
               onCancel={() => {
                 this.setState({currency: "", rateCurrency: "", rate: "", rateId: "", editRateVisible: false})
               }}>
          <div className="rate-info">
            <p>使用币种 : </p>
            <p className="currency">{currency}</p>
          </div>
          <div className="rate-info">
            <p>兑换币种 : </p>
            <p className="currency">{rateCurrency}</p>
          </div>
          <div className="rate-info">
            <p className="rate">汇率 :</p>
            <Input placeholder="请输入汇率" value={rate} onChange={(e) => {
              this.setState({rate: e.target.value})
            }}/>
          </div>
        </Modal>
      </div>
    );
  }
}


export default ExchangeRate;