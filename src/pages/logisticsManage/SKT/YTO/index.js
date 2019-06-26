import React from 'react';
import {Radio, Button, Table, message, Pagination, Modal} from 'antd';
import moment from 'moment';
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class SKTYto extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //表格数据
      data: [],
      //待发货 0  已发货 1
      status: 0,
      // 选中条目ID
      selectedIds: [],
      selectedRows: [],
      tableLoading: false,
      buttonLoading: false,
      pageNum: 1,
      pageSize: 100,
      pageTotal:0
    }
  }
  allow = this.props.appStore.getAllow.bind(this);
  componentDidMount() {
    this.getOrderInfo(0);
  }

  getOrderInfo() {
    const {status, pageNum, pageSize} =this.state;
    const showLoading = Is => this.setState({tableLoading:Is});
    showLoading(true);
    const data = {parm: status, pageNum, pageSize};
    this.ajax.post('/backend/sktYto/getSktYtoInfo', data).then(r => {
      const {data} = r.data;
      const dataObj = {
        selectedRows: [],
        selectedIds: [],
        data: [],
        pageTotal: 0,
        pageSizeOptions: [`100`,`200`,`500`,`1000`]
      };
      if (r.data.status === 10000) {
        dataObj['data'] = data.list;
        dataObj['pageTotal'] = data.total;
        dataObj['pageSizeOptions'] = [`100`,`200`,`500`,`${data.total > 1000 ? data.total : 1000}`];
      }
      this.setState(dataObj);
      showLoading(false);
      r.showError(true);
    }).catch(r => {
      console.error(r);
      showLoading(false);
      this.ajax.isReturnLogin(r, this);
    });
  }

  logisticsStatus(e) {
    if (this.state.status !== e.target.value) {
      this.setState({status: e.target.value},() => {
        this.getOrderInfo();
      });
    }
  }

  // 更改当前页或每页显示条数
  changePage(n,s) {
    this.setState({
      pageNum: n,
      pageSize: s,
      tableIsLoading:true
    },function(){
      this.getOrderInfo();
    })
  }

  // 查看详情
  showDetail(record) {
    const style = {float:'left',width:'120px'}, hidden = {overflow:'hidden'};
    Modal.info({
      title: '查看订单信息',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      // width: 600,
      content: <div style={hidden}>
        <div style={hidden}><div style={style}>箱号: </div>{record.parcelCode}</div>
        <div style={hidden}><div style={style}>商品名称: </div>{
          (Object.prototype.toString.call(record.sktProductVoList) === '[object Array]')
          && record.sktProductVoList.map((item, index) => (
            <span> {index === 0 ? '' : '  '}({index + 1}) {item.productName} </span>
          ))
        }</div>
        <div style={hidden}><div style={style}>收件人姓名: </div>{record.recipientsName}</div>
        <div style={hidden}><div style={style}>收件人手机: </div>{record.recipientsPhone}</div>
        <div style={hidden}><div style={style}>收件人省份: </div>{record.recipientsProvince}</div>
        <div style={hidden}><div style={style}>收件人城市: </div>{record.recipientsCity}</div>
        <div style={hidden}><div style={style}>收件人区: </div>{record.recipientsDistrict}</div>
        <div style={hidden}><div style={style}>收件人详细地址: </div>{record.recipientsAddress}</div>
        <div style={hidden}><div style={style}>用户微信昵称: </div>{record.wechatName}</div>
        <div style={hidden}><div style={style}>数量: </div>{record.productNum}</div>
        <div style={hidden}><div style={style}>包裹创建时间: </div>{
          record.createTime
            ? moment(record.createTime).format(`YYYY-MM-DD HH:mm:ss`)
            : null
        }</div>
      </div>
    })
  }

  // 上传
  uploadOrder (){
    this.setState({tableIsLoading:true});
    const {selectedRows} = this.state;
    const showLoading = Is => this.setState({buttonLoading: Is});
    showLoading(true);
    const dataList  = [];
    for (let v of selectedRows) dataList.push(v.parcelNo);
    this.ajax.post('/portal/speedexpressYto/uploadSelectSktToYto', dataList).then(r => {
      const {status, data, msg} = r.data;
      if (status === 10000) {
        if (data.FailList.length > 0) {
          message.error('部分箱子上传失败');
          Modal.error({
            title: '箱子上传失败列表',
            content: <div>
              {data.FailList.map(item => (
                <div>{item}</div>
              ))}
            </div>,
          });
        } else {
          message.success(msg);
        }
        this.getOrderInfo();
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const columns = [
      {title: "箱号", dataIndex: "parcelCode", key: "parcelCode",width:130},
      {title: "商品名称", dataIndex: "sktProductVoList", key: "sktProductVoList",
        render: text => (
          <div>{(() => {
            if (Object.prototype.toString.call(text) === '[object Array]') {
              if (text.length === 0) {
                return null
              } else if (text.length === 1) {
                return text[0].productName
              } else if (text.length > 1) {
                return `${text[0].productName}...等商品`
              }
            }
          })()}</div>
        )
      },
      {title: "收件人姓名", dataIndex: "recipientsName", key: "recipientsName",width:100},
      {title: "包裹创建时间", dataIndex: "createTime", key: "createTime",width:160,
        render: (text, record) => (
          <div>{text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''}</div>
        )
      },
      {title: '操作', dataIndex: '操作', key: '操作', width: 100, fixed: 'right',
        render: (text, record) => (
          <Button type="primary"
                  onClick={this.showDetail.bind(this, record)}
          >查看</Button>
        ),
      }
    ];
    const columns1 = [
      {title: "绑定的面单号", dataIndex: "mailNo", key: "mailNo", width:130}
    ];
    columns1.push(...columns);
    const RadioButton = Radio.Button, RadioGroup = Radio.Group;
    const {status, tableLoading, selectedIds, data, pageTotal, pageSize, pageNum, pageSizeOptions, selectedRows, buttonLoading} = this.state;
    return (
      <div className="SKTYto">
        <RadioGroup buttonStyle="solid"
                    className="radioBtn"
                    value={status}
                    onChange={this.logisticsStatus.bind(this)}
        >
          <RadioButton value={0}>待上传</RadioButton>
          <RadioButton value={1}>已上传</RadioButton>
        </RadioGroup>
        {status === 0 && <div className="btnLine">
          <Button type="primary"
                  // disabled={null}
                  onClick={this.uploadOrder.bind(this)}
                  loading={buttonLoading}
          >发送所选订单</Button>
        </div>}
        <div className="tableMain"
             style={{maxWidth: 1000}}
        >
          <Table className="tableList"
                 columns={status === 0 ? columns : columns1}
                 dataSource={data}
                 rowSelection={status === 0 ? {
                   selectedRowKeys: selectedIds,
                   selectedRows: selectedRows,
                   // 选择框变化时触发c
                   onChange: (selectedRowKeys, selectedRows) => {
                     this.setState({selectedIds: selectedRowKeys,selectedRows: selectedRows});
                   },
                 } : null}
                 bordered
                 loading={tableLoading}
                 pagination={false}
                 scroll={{ x:800, y: 550 }}
                 rowKey={(record, index) => `id_${index}`}/>
          <Pagination className="tablePagination"
                      total={pageTotal}
                      pageSize={pageSize}
                      current={pageNum}
                      showTotal={(total, range) =>
                        `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 ` }共 ${total} 条记录`
                      }
                      onChange={this.changePage.bind(this)}
                      showSizeChanger
                      pageSizeOptions={pageSizeOptions}
                      onShowSizeChange={this.changePage.bind(this)}
          />
        </div>
      </div>
    );
  }
}

export default SKTYto;