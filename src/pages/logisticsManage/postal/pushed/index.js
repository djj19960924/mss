import React from 'react';
import {Table, Pagination, message, Button, Modal} from 'antd';
import XLSX from 'xlsx';
import {inject, observer} from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class orderPushed extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      input: null,
      fileDate: [],
      success: 0,
      errorList: [],
      isImport: false,
      isImportOver: false,
      importVisible: false,
      tableDataList: [],
      // 自增常量
      Num: 0,
      tableIsLoading: false,
      pageTotal: 0,
      pageSize: 100,
      pageNum: 1,
      pageSizeOptions: [`50`,`100`,`200`,`300`]
    }
  }
  allow = this.props.appStore.getAllow.bind(this);
  componentDidMount() {
    // 生成导入用excel
    let input = document.createElement(`input`);
    input.type = `file`;
    input.className = "inputImport";
    input.onchange = this.loadFile.bind(this);
    this.setState({input: input});
    // 默认加载表格数据
    this.getPostalLogisticInfo();
  }

  // 导入
  importExcel(){
    const {isImport} =this.state;
    if (isImport) {
      message.warn(`请等待导入结束`)
    } else {
      this.setState({isImport:true});
      this.updateWaybillNoByBoxCode();
    }
  }

  // 根据箱号更新运单号
  updateWaybillNoByBoxCode() {
    const {Num, fileDate, errorList, success} = this.state;
    if (Num === fileDate.length) {
      message.success(`导入结束`);
      this.setState({isImport:false,isImportOver:true});
    } else {
      const data = {boxCode: fileDate[Num].箱号, waybillNo: fileDate[Num].运单号};
      this.ajax.post('/postalManagement/updateWaybillNoByBoxCode', data).then(r => {
        const {data, msg, status} = r.data;
        if (!msg && !data) {
          message.error(`后端数据错误, 即将退出导入功能`);
          this.setState({importVisible: false});
          return false;
        }
        if (status === 10000) {
          this.setState({success: (success+1)});
        } else {
          errorList.push({
            msg: msg,
            status: status,
            boxCode: fileDate[Num].箱号,
            waybillNo: fileDate[Num].运单号
          });
          this.setState({});
        }
        this.setState({Num:(Num+1)},()=>{
          this.updateWaybillNoByBoxCode();
        });
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    }
  }

  // 读取文件
  loadFile(e) {
    // console.log(e.target.files[0]);
    let item = e.target.files[0];
    if (!!item) {
      if (item.type === `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        || item.type === `application/vnd.ms-excel`) {
        // 校验文件为xls或xlsx
        let reader = new FileReader();
        reader.onload = (e) => {
          let data = e.target.result,wb;
          wb = XLSX.read(data, {
            type: 'binary'
          });
          // json
          console.log(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
          this.setState({fileDate: XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]),importVisible:true,isImportOver:false})
        };
        reader.readAsBinaryString(e.target.files[0]);
      } else {
        message.error(`文件类型错误`);
        e.target.value = ``
      }
    }
  }

  // 查看需要推送到邮政的包裹信息
  getPostalLogisticInfo() {
    const {pageNum, pageSize} = this.state;
    this.setState({tableIsLoading: true});
    let clearTable = () => this.setState({tableIsLoading:false});
    const data = {pageNum: pageNum, pageSize: pageSize};
    this.ajax.post('/postalManagement/getPostalLogisticInfo', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          tableDataList: data.list, pageTotal: data.total,
          pageSizeOptions: [`50`,`100`,`200`,`${data.total > 300 ? data.total : 300}`]
        })
      }
      clearTable();
      r.showError();
    }).catch(r => {
      console.error(r);
      clearTable();
      this.ajax.isReturnLogin(r, this);
    });
  }

  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize,
    },()=>{
      this.getPostalLogisticInfo();
    })
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { tableDataList, tableIsLoading, pageTotal, pageSize, pageNum, pageSizeOptions, input, importVisible, fileDate, success, errorList, isImport, isImportOver, } = this.state;
    const columns = [
      {title: `箱号`, dataIndex: `boxCode`, key: 'boxCode', width: 160},
      {title: `运单号`, dataIndex: `waybillNo`, key: 'waybillNo', width: 160},
      {title: `收件人`, dataIndex: `recipientsName`, key: 'recipientsName', width: 140},
      {title: `收件号码`, dataIndex: `recipientsPhone`, key: 'recipientsPhone', width: 140},
      {title: `重量(KG)`, dataIndex: `boxKg`, key: 'boxKg', width: 90},
      {title: `收件地址`, dataIndex: `recipientsAddress`, key: 'recipientsAddress'},
    ];
    return (
      <div className="orderPushed contentMain">
        <div className="title">
          <div className="titleMain">邮政 - 已推送订单</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <Button type="primary"
                  onClick={()=>{if (this.allow(95)) input.click()}}
                  disabled={!this.allow(95)}
                  title={!this.allow(95) ? '没有该操作权限' : null}
          >导入excel</Button>
          <Button type="primary"
                  style={{marginLeft: 10}}
                  href="//resource.maishoumiji.com/downloads/Import_Templates.xlsx"
          >下载excel模板</Button>       
        </div>

        <Modal title="导入订单信息"
               className="importModal"
               visible={importVisible}
               onOk={()=>{ isImportOver ? message.warn(`导入已结束,请重新导入excel文件`) : this.importExcel(); }}
               onCancel={()=>{
                 isImport ? message.warn(`导入结束前请勿关闭页面`)
                 : this.setState({importVisible:false,Num:0,fileDate:[],errorList:[],success:0,})
               }}
               width={650}
        >
          <div>成功数据: {success}/{fileDate.length}</div>
          <div>错误数据:</div>
          {errorList.map((item,i) => (
            <div key={i}>{item.msg}, 错误码:{item.status}, 箱号:{item.boxCode}, 运单号:{item.waybillNo}</div>
          ))}
          {errorList.length === 0 ? ''
            : <div style={{color:'rgba(255,0,0,.7)'}}>请留存错误数据, 以便处理失败单号</div>}
        </Modal>

        <div className="tableMain"
             style={{maxWidth: 1200}}
        >
          {/*表单主体*/}
          <Table className="tableList"
                 dataSource={tableDataList}
                 columns={columns}
                 pagination={false}
                 loading={tableIsLoading}
                 bordered
                 scroll={{ y: 550, x: 900 }}
                 rowKey={(record, index) => `${index}`}
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
      </div>
    );
  }

}

export default orderPushed;