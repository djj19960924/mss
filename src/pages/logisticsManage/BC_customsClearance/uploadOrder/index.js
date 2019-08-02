import React from 'react';
import { Radio, Table, Button, Pagination, message, Modal, } from 'antd';
import XLSX from 'xlsx';
import moment from 'moment';
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class BCUploadOrder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableDataList: [],
      pageTotal: 0,
      pageSize: 300,
      pageNum: 1,
      pageSizeOptions: ['50','100','200','300'],
      isTableLoading: false,
      fetchNum: 0,
      showModal: false,
      newModal: true,
      isUpload: false,
      success: 0,
      fail: 0,
      // BC推送状态
      BCStatus: 0,
    };
  }
  allow = this.props.appStore.getAllow.bind(this);
  componentDidMount() {
    this.queryParcelInfoToBc();
  }

  // 导出推单模板excel
  exportExcel () {
    this.setState({isUpload: true});
    const elt = document.getElementById('tableList');
    const wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
    XLSX.writeFile(wb, `BC推单表 ${moment(new Date()).format('YYYYMMDD-HHmmss')}.xlsx`);
    this.setState({newModal: false});
    this.setParcelProductIsBC();
  }

  // 推单到BC,导出excel时将商品状态置为已推单
  setParcelProductIsBC() {
    const { tableDataList, fetchNum, success, } = this.state;
    if (fetchNum < tableDataList.length) {
      const data = {
        productCode: tableDataList[fetchNum].productCode,
        parcelNo: tableDataList[fetchNum].parcelNo
      };
      this.ajax.post('/bcManagement/setParcelProductIsBC', data).then(r => {
        const {status} = r.data;
        const dataObj = {fetchNum: (fetchNum+1)};
        if (status === 10000) {
          // 成功静默
          // message.success(`${r.msg}`)
          dataObj.success = (success+1);
        }
        this.setState(dataObj,()=>{
          this.setParcelProductIsBC();
        });
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
        message.error(`前端错误: 请求发送失败, 请重试`);
        this.setState({isUpload: false,fetchNum: 0,});
      });
    } else {
      this.setState({isUpload: false,fetchNum: 0,});
      this.queryParcelInfoToBc();
    }
  }

  // 获取需要导出到BC的推单商品信息
  queryParcelInfoToBc() {
    const { pageNum, pageSize, BCStatus, } = this.state;
    this.setState({isTableLoading: true});
    const url = BCStatus === 0 ? 'queryParcelInfoToBc' : 'queryParcelInfoIsBc';
    const data = {pageNum, pageSize};
    this.ajax.post(`/bcManagement/${url}`, data).then(r => {
      const {status, data} = r.data;
      const dataObj = {
        tableDataList: [],
        pageTotal: 0,
        pageSizeOptions: ['50','100','200','300'],
        isTableLoading: false
      };
      if (status === 10000) {
        dataObj.tableDataList = data.list;
        dataObj.pageTotal = data.total;
        dataObj.pageSizeOptions = ['50','100','200',`${data.total > 300 ? data.total : 300}`];
      }
      this.setState(dataObj);
      r.showError();
    }).catch(r => {
      this.setState({isTableLoading: false});
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 改变页码
  changePage(pageNum,pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize,
    },()=>{
      this.queryParcelInfoToBc();
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
        <div style={hidden}><div style={style}>客户内部单号: </div>{record.parcelNo}</div>
        <div style={hidden}><div style={style}>圆通快递单号: </div>{record.mailNo}</div>
        <div style={hidden}><div style={style}>身份证号码: </div>{record.receiveCard}</div>
        <div style={hidden}><div style={style}>收件人: </div>{record.recipientsName}</div>
        <div style={hidden}><div style={style}>收件电话: </div>{record.recipientsPhone}</div>
        <div style={hidden}><div style={style}>省份: </div>{record.recipientsProvince}</div>
        <div style={hidden}><div style={style}>城市: </div>{record.recipientsCity}</div>
        <div style={hidden}><div style={style}>县区: </div>{record.recipientsDistrict}</div>
        <div style={hidden}><div style={style}>收件地址: </div>{record.recipientsAddress}</div>
        <div style={hidden}><div style={style}>下单时间: </div>{
          record.createTime
            ? moment(record.createTime).format(`YYYY-MM-DD HH:mm:ss`)
            : null
        }</div>
        <div style={hidden}><div style={style}>商品货号: </div>{`JD${record.productCode}`}</div>
        <div style={hidden}><div style={style}>商品名称: </div>{record.productName}</div>
        <div style={hidden}><div style={style}>数量: </div>{record.productNum}</div>
        <div style={hidden}><div style={style}>成本价: </div>{record.costPrice}</div>
        <div style={hidden}><div style={style}>库存地: </div>{record.purchaseArea}</div>
        <div style={hidden}><div style={style}>商品规格: </div>{record.specificationType}</div>
        <div style={hidden}><div style={style}>品牌: </div>{record.brand}</div>
        <div style={hidden}><div style={style}>净重: </div>{record.netWeight}</div>
        <div style={hidden}><div style={style}>毛重: </div>{record.parcelWeight}</div>
        <div style={hidden}><div style={style}>原产国: </div>{record.purchaseArea}</div>
      </div>
    })
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const columns = [
      {title: '客户内部单号', dataIndex: 'parcelNo', key: 'parcelNo', width: 140},
      {title: '圆通快递单号', dataIndex: 'mailNo', key: 'mailNo', width: 140},
      {title: '收件人', dataIndex: 'recipientsName', key: 'recipientsName', width: 140},
      {title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 160,
        render: (text, record) => (
          <div>{text ? moment(text).format(`YYYY-MM-DD HH:mm:ss`) : null}</div>
        ),
      },
      {title: '商品名称', dataIndex: 'productName', key: 'productName'},
      {title: '操作', dataIndex: '操作', key: '操作', width: 100, fixed: 'right',
        render: (text, record) => (
          <Button type="primary"
                  onClick={this.showDetail.bind(this, record)}
          >查看</Button>
        ),
      }
    ];
    const RadioButton = Radio.Button, RadioGroup = Radio.Group;
    const { tableDataList, pageTotal, pageSize, pageNum, pageSizeOptions, isTableLoading, showModal, isUpload, success, fail, newModal, BCStatus, } = this.state;
    return (
      <div className="BCUploadOrder contentMain">
        <div className="btnLine">
          {/*查询条件单选行*/}
          <RadioGroup buttonStyle="solid"
                      className="radioBtn"
                      value={BCStatus}
                      onChange={(e)=>{
                        this.setState({BCStatus:e.target.value},()=>{
                          this.queryParcelInfoToBc();
                        });
                      }}
          >
            <RadioButton value={0}>未推送</RadioButton>
            <RadioButton value={1}>已推送</RadioButton>
          </RadioGroup>
        </div>
        {(BCStatus === 0) && <div className="btnLine">
          <Button type="primary"
                  onClick={()=>{
                    if (this.allow(87)) this.setState({showModal: true,success:0,fail:0,})
                  }}
                  disabled={!this.allow(87)}
                  title={!this.allow(87) ? '没有该操作权限' : null}
          >导出/推送</Button>
        </div>}
        <div className="tableMain"
             style={{maxWidth: 1000}}
        >
          {/*表单主体*/}
          <Table className="tableList"
                 dataSource={tableDataList}
                 columns={columns}
                 pagination={false}
                 loading={isTableLoading}
                 bordered
                 scroll={{ y: 500, x: 800 }}
                 rowKey={(record, index) => `id_${index}`}
          />
          {/*分页*/}
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

        <Modal title="导出推单模板"
               visible={showModal}
               onCancel={()=>{
                 if (isUpload) {
                   message.error(`操作完成前无法关闭窗口`);
                 } else {
                   this.setState({showModal: false});
                   this.queryParcelInfoToBc();
                 }
               }}
               bodyStyle={{textAlign: `center`,}}
               footer={<div style={{textAlign: `center`}}>
                 <Button type="primary"
                         onClick={()=>{
                           if (newModal) {
                             this.exportExcel();
                           } else {
                             message.warn(`已导出, 请关闭窗口重试`)
                           }
                         }}
                         loading={isUpload}
                 >确定</Button>
               </div>}
        >
          <p>点击确定, 导出当前页</p>
          <p>成功 {success}/{tableDataList.length}, 失败{fail}</p>
        </Modal>
        {/*导出用表单*/}
        <Table id="tableList"
               columns={[
                 {title: '客户内部单号', dataIndex: 'parcelNo', key: 'parcelNo', width: 140},
                 {title: '圆通快递单号', dataIndex: 'mailNo', key: 'mailNo', width: 140},
                 {title: '身份证号码', dataIndex: 'receiveCard', key: 'receiveCard', width: 140},
                 {title: '收件人', dataIndex: 'recipientsName', key: 'recipientsName', width: 140},
                 {title: '收件电话', dataIndex: 'recipientsPhone', key: 'recipientsPhone', width: 140},
                 {title: '省份', dataIndex: 'recipientsProvince', key: 'recipientsProvince', width: 140},
                 {title: '城市', dataIndex: 'recipientsCity', key: 'recipientsCity', width: 140},
                 {title: '县区', dataIndex: 'recipientsDistrict', key: 'recipientsDistrict', width: 140},
                 {title: '收件地址', dataIndex: 'recipientsAddress', key: 'recipientsAddress', width: 140},
                 {title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 140,
                   render: (text, record) => (
                     <div>{text ? moment(text).format(`YYYY-MM-DD HH:mm:ss`) : null}</div>
                   ),
                 },
                 {title: '商品货号', dataIndex: 'productCode', key: 'productCode', width: 140,
                   render: (text, record) => (
                     <div>{`JD${text}`}</div>
                   ),
                 },
                 {title: '商品名称', dataIndex: 'productName', key: 'productName', width: 140},
                 {title: '数量', dataIndex: 'productNum', key: 'productNum', width: 140},
                 {title: '成本价', dataIndex: 'costPrice', key: 'costPrice', width: 140},
                 {title: '库存地', dataIndex: 'purchaseArea', key: 'purchaseArea', width: 140},
                 {title: '商品规格', dataIndex: 'specificationType', key: 'specificationType', width: 140},
                 {title: '品牌', dataIndex: 'brand', key: 'brand', width: 140},
                 {title: '净重', dataIndex: 'netWeight', key: 'netWeight', width: 140},
                 // {title: '毛重', dataIndex: 'grossWeight', key: 'grossWeight', width: 140},
                 {title: '毛重', dataIndex: 'parcelWeight', key: 'parcelWeight', width: 140},
                 {title: '原产国', dataIndex: 'purchaseArea', key: 'purchaseArea2', width: 140},
               ]}
               dataSource={tableDataList}
               style={{display: 'none'}}
               pagination={false}
               rowKey={(record, index) => `id_${index}`}
        />
        {/*导出用表单 NEW*/}
        <Table id="tableList_new"
               columns={[
                 {title: '客户内部单号', dataIndex: 'parcelNo', key: 'parcelNo', width: 140},
                 {title: '圆通快递单号', dataIndex: 'mailNo', key: 'mailNo', width: 140},
                 {title: '身份证号码', dataIndex: 'receiveCard', key: 'receiveCard', width: 140},
                 {title: '收件人', dataIndex: 'recipientsName', key: 'recipientsName', width: 140},
                 {title: '收件电话', dataIndex: 'recipientsPhone', key: 'recipientsPhone', width: 140},
                 {title: '省份', dataIndex: 'recipientsProvince', key: 'recipientsProvince', width: 140},
                 {title: '城市', dataIndex: 'recipientsCity', key: 'recipientsCity', width: 140},
                 {title: '县区', dataIndex: 'recipientsDistrict', key: 'recipientsDistrict', width: 140},
                 {title: '收件地址', dataIndex: 'recipientsAddress', key: 'recipientsAddress', width: 140},
                 {title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 140,
                   render: (text, record) => (
                     <div>{text ? moment(text).format(`YYYY-MM-DD HH:mm:ss`) : null}</div>
                   ),
                 },
                 {title: '商品货号', dataIndex: 'productCode', key: 'productCode', width: 140,
                   render: (text, record) => (
                     <div>{`JD${text}`}</div>
                   ),
                 },
                 {title: '商品名称', dataIndex: 'productName', key: 'productName', width: 140},
                 {title: '数量', dataIndex: 'productNum', key: 'productNum', width: 140},
                 {title: '成本价', dataIndex: 'costPrice', key: 'costPrice', width: 140},
                 {title: '库存地', dataIndex: 'purchaseArea', key: 'purchaseArea', width: 140},
                 {title: '商品规格', dataIndex: 'specificationType', key: 'specificationType', width: 140},
                 {title: '品牌', dataIndex: 'brand', key: 'brand', width: 140},
                 {title: '净重', dataIndex: 'netWeight', key: 'netWeight', width: 140},
                 // {title: '毛重', dataIndex: 'grossWeight', key: 'grossWeight', width: 140},
                 {title: '毛重', dataIndex: 'parcelWeight', key: 'parcelWeight', width: 140},
                 {title: '原产国', dataIndex: 'purchaseArea', key: 'purchaseArea2', width: 140},
               ]}
               dataSource={tableDataList}
               style={{display: 'none'}}
               pagination={false}
               rowKey={(record, index) => `id_${index}`}
        />
      </div>
    )
  }

}

export default BCUploadOrder;