import React from 'react';
import {Table , Button, Modal, message} from 'antd';
import XLSX from 'xlsx';
import moment from 'moment';
import './index.less';

class orderUnmatched extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      tableList:[],
      selectedRowKeys: [],
      tableIsLoading: false,
      buttonIsLoading: false,
      // 分页相关
      pageSize: 100,
      pageSizeOptions: [`50`,`100`,`200`,`300`],
    };
  }
  componentDidMount() {
    this.getBoxOrderList2();
  }
  getBoxOrderList2 (){
    const showLoading = Is => {this.setState({tableIsLoading: Is})};
    showLoading(true);
    this.ajax.post('/box/getBoxOrderList2').then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({tableList: data, selectedRowKeys: []});
      } else if (r.data.status < 10000) {
        this.setState({tableList: [], selectedRowKeys: []});
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }
  uploadChoose() {
    const {selectedRowKeys} = this.state;
    const data = {boxCodeList: selectedRowKeys};
    this.ajax.post('/box/getUploadBoxOrderByBoxCode', data).then(r => {
      if (r.data.status === 10000) {
        message.success(r.data.msg);
        this.getBoxOrderList2();
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }
  showDetail(record) {
    const style = {float:'left',width:'120px'}, hidden = {overflow:'hidden'};
    Modal.info({
      title: '查看订单信息',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      width: 600,
      content: <div style={hidden}>
        <div style={{float:'left', width: 240}}>
          <div style={hidden}><div style={style}>客户订单号: </div>{record.boxCode}</div>
          <div style={hidden}><div style={style}>寄件人: </div>{record.sender}</div>
          <div style={hidden}><div style={style}>寄件人电话号码: </div>{record.senderPhone}</div>
          <div style={hidden}><div style={style}>寄件人邮编: </div>{record.senderPostcode}</div>
          <div style={hidden}><div style={style}>寄件人地址: </div>{record.senderAddress}</div>
          <div style={hidden}><div style={style}>收件省/直辖市: </div>{record.recipientsProvince}</div>
          <div style={hidden}><div style={style}>收件城市: </div>{record.recipientsCity}</div>
          <div style={hidden}><div style={style}>收件区域: </div>{record.recipientsDistrict}</div>
          <div style={hidden}><div style={style}>收件人: </div>{record.recipientsName}</div>
          <div style={hidden}><div style={style}>收件人邮编: </div>{record.postcode}</div>
          <div style={hidden}><div style={style}>收件人地址: </div>{record.recipientsAddress}</div>
          <div style={hidden}><div style={style}>收件人电话号码: </div>{record.recipientsPhone}</div>
          <div style={hidden}><div style={style}>实际重量: </div>{record.boxKg}</div>
          <div style={hidden}><div style={style}>原产地区: </div>{record.countryOrigin}</div>
          <div style={hidden}><div style={style}>是否代缴关税: </div>{record.hasPreaid === 0 ? '否' : '是'}</div>
        </div>
        <div style={{float:'left', width: 240, marginLeft: 8}}>
          <div style={hidden}><div style={style}>行邮税号1: </div>{record.taxNumber}</div>
          <div style={hidden}><div style={style}>物品名称1: </div>{record.name}</div>
          <div style={hidden}><div style={style}>规格型号1: </div>{record.specification}</div>
          <div style={hidden}><div style={style}>物品数量1: </div>{record.number}</div>
          <div style={hidden}><div style={style}>计量单位1: </div>{record.modelNumber}</div>
          <div style={hidden}><div style={style}>物品单价1: </div>{record.price}</div>
          <div style={hidden}><div style={style}>行邮税号2: </div>{record.taxNumber2}</div>
          <div style={hidden}><div style={style}>物品名称2: </div>{record.name2}</div>
          <div style={hidden}><div style={style}>规格型号2: </div>{record.specification2}</div>
          <div style={hidden}><div style={style}>物品数量2: </div>{record.number2}</div>
          <div style={hidden}><div style={style}>计量单位2: </div>{record.modelNumber2}</div>
          <div style={hidden}><div style={style}>物品单价2: </div>{record.price2}</div>
          <div style={hidden}><div style={style}>行邮税号3: </div>{record.taxNumber3}</div>
          <div style={hidden}><div style={style}>物品名称3: </div>{record.name3}</div>
          <div style={hidden}><div style={style}>规格型号3: </div>{record.specification3}</div>
          <div style={hidden}><div style={style}>物品数量3: </div>{record.number3}</div>
          <div style={hidden}><div style={style}>计量单位3: </div>{record.modelNumber3}</div>
          <div style={hidden}><div style={style}>物品单价3: </div>{record.price3}</div>
        </div>
        </div>
    })
  }
  exportExcel() {
    const elt = document.getElementById('tableList');
    const wb = XLSX.utils.table_to_book(elt, {raw: true, sheet:"Sheet JS"});
    XLSX.writeFile(wb, (`未匹配订单_${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.xlsx`));
  }
  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const columns = [
      {title: '客户订单号', dataIndex: 'boxCode', key: 'boxCode', width: 140},
      {title: '收件人', dataIndex: 'recipientsName', key: 'recipientsName'},
      {title: '收件人电话号码', dataIndex: 'recipientsPhone', key: 'recipientsPhone', width: 120},
      {title: '重量(kg)', dataIndex: 'boxKg', key: 'boxKg', width: 80},
      {title: '操作', dataIndex: '操作', key: '操作', width: 100, fixed: 'right',
        render: (text, record) => (
          <Button type="primary"
                  onClick={this.showDetail.bind(this, record)}
          >查看</Button>
        )
      }
    ];
    const columnsForExport = [
      {title: '客户订单号', dataIndex: 'boxCode', key: 'boxCode'},
      {title: '寄件人', dataIndex: 'sender', key: 'sender'},
      {title: '寄件人电话号码', dataIndex: 'senderPhone', key: 'senderPhone'},
      {title: '寄件人邮编', dataIndex: 'senderPostcode', key: 'senderPostcode'},
      {title: '寄件人地址', dataIndex: 'senderAddress', key: 'senderAddress'},
      {title: '收件省/直辖市', dataIndex: 'recipientsProvince', key: 'recipientsProvince'},
      {title: '收件城市', dataIndex: 'recipientsCity', key: 'recipientsCity'},
      {title: '收件区域', dataIndex: 'recipientsDistrict', key: 'recipientsDistrict'},
      {title: '收件人', dataIndex: 'recipientsName', key: 'recipientsName'},
      {title: '收件人邮编', dataIndex: 'postcode', key: 'postcode'},
      {title: '收件人地址', dataIndex: 'recipientsAddress', key: 'recipientsAddress'},
      {title: '收件人电话号码', dataIndex: 'recipientsPhone', key: 'recipientsPhone'},
      {title: '实际重量', dataIndex: 'boxKg', key: 'boxKg'},
      {title: '原产地区', dataIndex: 'countryOrigin', key: 'countryOrigin'},
      {title: '是否代缴关税', dataIndex: 'hasPreaid', key: 'hasPreaid',
        render: text => <span>{text === 0 ? "否" : "是"}</span>
      },
      {title: '行邮税号', dataIndex: 'taxNumber', key: 'taxNumber'},
      {title: '物品名称', dataIndex: 'name', key: 'name'},
      {title: '规格型号', dataIndex: 'specification', key: 'specification'},
      {title: '物品数量', dataIndex: 'number', key: 'number'},
      {title: '计量单位', dataIndex: 'modelNumber', key: 'modelNumber'},
      {title: '物品单价', dataIndex: 'price', key: 'price'},
      {title: '行邮税号', dataIndex: 'taxNumber2', key: 'taxNumber2'},
      {title: '物品名称', dataIndex: 'name2', key: 'name2'},
      {title: '规格型号', dataIndex: 'specification2', key: 'specification2'},
      {title: '物品数量', dataIndex: 'number2', key: 'number2'},
      {title: '计量单位', dataIndex: 'modelNumber2', key: 'modelNumber2'},
      {title: '物品单价', dataIndex: 'price2', key: 'price2'},
      {title: '行邮税号', dataIndex: 'taxNumber3', key: 'taxNumber3'},
      {title: '物品名称', dataIndex: 'name3', key: 'name3'},
      {title: '规格型号', dataIndex: 'specification3', key: 'specification3'},
      {title: '物品数量', dataIndex: 'number3', key: 'number3'},
      {title: '计量单位', dataIndex: 'modelNumber3', key: 'modelNumber3'},
      {title: '物品单价', dataIndex: 'price3', key: 'price3'}
    ];
    const {selectedRowKeys, tableList, tableIsLoading, pageSize, pageSizeOptions, buttonIsLoading} = this.state;

    return (
      <div className="orderUnmatched contentMain">
        <div className="title">
          <div className="titleMain">ETK - 未匹配订单</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <Button type="primary"
                  onClick={this.uploadChoose.bind(this)}
                  loading={buttonIsLoading}
                  disabled={selectedRowKeys.length === 0}
          >上传ETK</Button>
          <Button type="primary"
                  onClick={this.exportExcel.bind(this)}
          >导出Excel</Button>
        </div>
        <div className="tableMain"
             style={{maxWidth: 1000}}
        >
          {/*表单主体*/}
          <Table className="tableList"
                 dataSource={tableList}
                 columns={columns}
                 pagination={{
                   pageSize: pageSize,
                   showTotal: (total, range) =>
                     `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 ` }共 ${total} 条记录`,
                   showSizeChanger: true,
                   pageSizeOptions: pageSizeOptions
                 }}
                 loading={tableIsLoading}
                 rowSelection={{
                   selectedRowKeys: selectedRowKeys,
                   // 选择框变化时触发
                   onChange: selectedRowKeys => this.setState({selectedRowKeys: selectedRowKeys})
                 }}
                 bordered
                 scroll={{ y: 550, x: 800 }}
                 rowKey={record => `${record.boxCode}`}
          />
        </div>
        <Table id="tableList"
               style={{display: 'none'}}
               className="tableList"
               dataSource={tableList}
               columns={columnsForExport}
               rowKey={(record, index) => index}
               pagination={false}
        />
      </div>
    )
  }
}

export default orderUnmatched;