import React from 'react';
import {Table , Button, Modal} from 'antd';
import XLSX from 'xlsx';
import moment from 'moment';
import './index.less';

class orderMatched extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      tableList:[],
      tableIsLoading: false,
      // 分页相关
      pageSize: 100,
      pageSizeOptions: [`50`,`100`,`200`,`300`],
    };
  }
  componentDidMount() {
    this.getUploadBoxOrder();
  }
  getUploadBoxOrder() {
    const showLoading = Is => {this.setState({tableIsLoading: Is})};
    showLoading(true);
    this.ajax.post('/box/getUploadBoxOrder').then(r => {
      if (r.data.status === 10000) {
        this.setState({tableList: r.data.data});
      } else if (r.data.status < 10000) {
        this.setState({tableList: []});
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
    return false;
  }
  exportExcel () {
    const elt = document.getElementById('tableList');
    const wb = XLSX.utils.table_to_book(elt, {raw: true, sheet:"Sheet JS"});
    XLSX.writeFile(wb, `已匹配订单_${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.xlsx`);
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
          <div style={hidden}><div style={style}>行邮税号: </div>{record.taxNumber}</div>
          <div style={hidden}><div style={style}>物品名称: </div>{record.name}</div>
          <div style={hidden}><div style={style}>规格型号: </div>{record.specification}</div>
          <div style={hidden}><div style={style}>物品数量: </div>{record.number}</div>
          <div style={hidden}><div style={style}>计量单位: </div>{record.modelNumber}</div>
          <div style={hidden}><div style={style}>物品单价: </div>{record.price}</div>
        </div>
      </div>
    })
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
      {title: '客户订单号', dataIndex: 'boxCode', key: 'boxCode', width: 120},
      {title: '寄件人', dataIndex: 'sender', key: 'sender', width: 100},
      {title: '寄件人电话号码', dataIndex: 'senderPhone', key: 'senderPhone', width: 100},
      {title: '寄件人邮编', dataIndex: 'senderPostcode', key: 'senderPostcode', width: 70},
      {title: '寄件人地址', dataIndex: 'senderAddress', key: 'senderAddress', width: 100,
        render: (text, record) => (  //塞入内容
          <div className="ellipsis" style={{width: 79}} title={record.senderAddress}>{record.senderAddress}</div>
        ),
      },
      {title: '收件省/直辖市', dataIndex: 'recipientsProvince', key: 'recipientsProvince', width: 120},
      {title: '收件城市', dataIndex: 'recipientsCity', key: 'recipientsCity', width: 100},
      {title: '收件区域', dataIndex: 'recipientsDistrict', key: 'recipientsDistrict', width: 100},
      {title: '收件人', dataIndex: 'recipientsName', key: 'recipientsName', width: 100},
      {title: '收件人邮编', dataIndex: 'postcode', key: 'postcode', width: 70},
      {title: '收件人地址', dataIndex: 'recipientsAddress', key: 'recipientsAddress', width: 100},
      {title: '收件人电话号码', dataIndex: 'recipientsPhone', key: 'recipientsPhone', width: 110},
      {title: '实际重量', dataIndex: 'boxKg', key: 'boxKg', width: 60},
      {title: '原产地区', dataIndex: 'countryOrigin', key: 'countryOrigin', width: 60},
      {title: '是否代缴关税', dataIndex: 'hasPreaid', key: 'hasPreaid', width: 80,
        render: (text, record) => (  //塞入内容
          <span>{record.hasPreaid === 0 ? "否" : "是"}</span>
        ),
      },
      {title: '行邮税号', dataIndex: 'taxNumber', key: 'taxNumber', width: 100},
      {title: '物品名称', dataIndex: 'name', key: 'name', width: 80},
      {title: '规格型号', dataIndex: 'specification', key: 'specification', width: 80},
      {title: '物品数量', dataIndex: 'number', key: 'number', width: 80},
      {title: '计量单位', dataIndex: 'modelNumber', key: 'modelNumber', width: 80},
      {title: '物品单价', dataIndex: 'price', key: 'price', width: 80}
    ];
    const {tableList, pageSize, pageSizeOptions, tableIsLoading} = this.state;
    return (
      <div className="orderMatched contentMain">
        <div className="title">
          <div className="titleMain">ETK - 已匹配订单</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <Button type="primary"
                  onClick={this.exportExcel.bind(this)}
          >导出Excel</Button>
        </div>
        <div className="tableMain">
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
                 bordered
                 scroll={{ y: 550, x: 800 }}
                 rowKey={(record, index) => index}
          />
        </div>
        <Table id='tableList'
               dataSource={tableList}
               style={{display: 'none'}}
               columns={columnsForExport}
               rowKey={(record, index) => index}
               pagination={false}
        />
      </div>
    )
  }
}

export default orderMatched;