import React from 'react';
import {Select, Button, Table, message, Pagination, Form, Modal, Input, Icon, } from 'antd';
import moment from 'moment';
import {inject, observer} from 'mobx-react/index';
import XLSX from 'xlsx';
import './index.less';
import countryList from '@js/country';
const FormItem = Form.Item;
const Option = Select.Option;

// 正则小计(中文+韩文+英文+数字+()（）_/):
//
// new RegExp('^[\u4e00-\u9fa5]|[\uac00-\ud7a3]|[a-zA-Z0-9]|[\(\)\-\_\/]+$')
// 中文: [\u4e00-\u9fa5]
// (包括所有中文汉字,日文汉字,韩文汉字, 根据系统文字显示相应汉字字符样式)
// 韩文: [\uac00-\ud7a3]
// 日文: [\u3041-\u30ff]
// 中文括号(即（）): [\uff08\uff09]
// 正整数正则: /^[1-9]\d*$/

@inject('appStore') @observer @Form.create()
class setRebate extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      // 分页相关
      pageSize: 100,
      pageNum: 1,
      pageTotal: 0,
      pageSizeOptions: [`50`, `100`, `200`, `300`],
      //选择的国家
      country:'',
      //国家列表
      countries: [],
      // 商场列表
      shopList: [],
      // 当前选择的商场
      currentShop: undefined,
      // 品牌列表
      tableDataList: [],
      // 弹窗标题
      modalTitle: '新增返点信息',
      // 弹窗开关
      modalVisible: false,
      // 弹窗类型
      modalType: 'create',
      // 编辑所需额外字段
      modalEditData: {},
      // 当前所选删除品牌
      currentRecord: {},
      // 删除弹框
      deleteModalVisible: false,
      tableIsLoading: false,
      input: null,
      fileDate: [],
      importVisible:false,
      success: 0,
      errorList: [],
      isImportOver: false,
      // 自增常量
      Num: 0,
      exportDataList:[]
    };
  }
  allow = this.props.appStore.getAllow.bind(this);
  
  componentDidMount() {
    let countries = [];
    for (let i of countryList) countries.push(<Option key={i.id} value={i.nationName}>{i.nationName}</Option>);
    this.setState({countries: countries})
    //生成导入用excel
    let input = document.createElement(`input`);
    input.type = `file`;
    input.className = "inputImport";
    input.onchange = this.loadFile.bind(this);
    this.setState({input: input});
    this.getExportDataList();
  }

  // 导入
  importExcel(){
    const {isImport} =this.state;
    if (isImport) {
      message.warn(`请等待导入结束`)
    } else {
      this.setState({isImport:true});
      this.updateRebate();
    }
  }
  // 读取文件
  loadFile(e) {
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
          let fileDates = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          let fileDate = []
          fileDates.forEach(item=>{
            if(item['返点率']){
              fileDate.push(item)
            }
          })
          this.setState({fileDate: fileDate,importVisible:true,isImportOver:false})
        };
        reader.readAsBinaryString(e.target.files[0]);
      } else {
        message.error(`文件类型错误`);
        e.target.value = ``
      }
    }
  }

  //更新返点率
  updateRebate(){
    const {Num, fileDate, errorList, success,input} = this.state;
    if(Num === fileDate.length){
      message.success(`导入结束`);
      input.value = ""
      this.setState({isImport:false,isImportOver:true,input:input});
    }else{
      const data = {
        brandId: Number(fileDate[Num]['品牌表id']),
        brandName: fileDate[Num]['品牌名称'],
        brandType: Number(fileDate[Num]['品牌类型']),
        mallName: fileDate[Num]['商场'],
        rebateId: Number(fileDate[Num]['返点表id']),
        rebateRate: fileDate[Num]['返点率'],
        productCode:""
      };
      this.ajax.post('/rebate/insertOrUpdateRebate',data).then(r=>{
        const {data,msg, status} = r.data;
        if(!msg){
          message.error(`后端数据错误, 即将退出导入功能`);
          this.setState({importVisible: false});
          return false;
        }
        if(status===10000){
          this.setState({success: (success+1)});
        }else{
          errorList.push({
            msg: msg,
            status: status,
            brandId: Number(fileDate[Num]['品牌表id']),
            brandName: fileDate[Num]['品牌名称'],
            brandType: Number(fileDate[Num]['品牌类型']),
            mallName: fileDate[Num]['商场'],
            rebateId: Number(fileDate[Num]['返点表id']),
            rebateRate: fileDate[Num]['返点率']
          })
          this.setState({});
        }
        this.setState({Num:(Num+1)},()=>{
          this.updateRebate();
        });
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    }
  }

  // 监听选择国家事件
  selectCountry(nationName) {
    this.setState({
      country: nationName,
      tableDataList: [],
      pageTotal: 0,
      mallName: '',
      currentShop: undefined
    }, () => {
      this.getMallListByNationName();
    });
  }
  // 根据国家名称获取商场列表
  getMallListByNationName() {
    const {country} = this.state;
    this.ajax.post('/mall/getMallListByNationName',{nationName:country}).then(r => {
      if (r.data.status === 10000) {
        const dataList = [];
        for (let i of r.data.data) dataList.push(<Option key={i.mallId} value={i.mallName}>{i.mallName}</Option>);
        this.setState({shopList: dataList})
      }
      r.showError();
    }).catch(r => {
      this.ajax.isReturnLogin(r,this);
    });
    return false;
  }
  // 选择商场触发
  selectShop(shopName) {
    this.props.form.setFieldsValue({mallName:shopName});
    this.setState({currentShop:shopName},() => {
      this.selectAllRebateByMallName();
    })
  }
  // 根据商场获取品牌列表
  selectAllRebateByMallName() {
    const {pageNum, pageSize, currentShop} = this.state;
    this.setState({tableIsLoading:true});
    this.ajax.get('/rebate/selectAllRebateByMallName', `mallName=${currentShop}&pageSize=${pageSize}&pageNum=${pageNum}`).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          pageTotal: data.total,
          tableDataList: data.list,
        })
      } else if (r.data.status < 10000) {
        this.setState({
          pageTotal: 0,
          tableDataList: []
        })
      }
      this.setState({tableIsLoading:false});
      r.showError();
    }).catch(r => {
      this.setState({tableIsLoading:false});
      this.ajax.isReturnLogin(r, this);
    });
  }
  // 分页操作
  changePage(pageNum,pageSize) {
    this.selectAllRebateByMallName(pageNum,pageSize)
  }
  // 打开编辑弹窗
  openEdit(q) {
    this.setState({
      modalType: 'edit',
      modalVisible: true,
      modalEditData: {
        brandId: q.brandId,
        rebateId: q.rebateId
      }
    });
    this.props.form.setFieldsValue({
      mallName: q.mallName,
      brandName: q.brandName,
      productCode: q.productCode,
      rebateRate: q.rebateRate,
      brandType: q.brandType,
    })
  }
  // 打开新增弹窗
  openCreate() {
    this.setState({
      modalType: 'create',
      modalVisible: true,
    })
  }
  // 关闭弹窗
  closeModal() {
    const { setFieldsValue, resetFields, } = this.props.form;
    const { currentShop } = this.state;
    this.setState({
      modalVisible: false,
    });
    // 重置表单
    resetFields();
    // 判断是否已选商场
    if (!!currentShop) setFieldsValue({'mallName': currentShop});
    this.selectAllRebateByMallName();
  }
  // 品牌名称验证
  brandNameValidator(rule, val, callback) {
    let ruleMain = new RegExp('^[\u4e00-\u9fa5]|[\u3041-\u30ff]|[\uac00-\ud7a3]|[a-zA-Z0-9]|[()（）_/]|-|\\s+$');
    let l = 0;
    for (let i = 0; i < val.length; i++) {
      // charCodeAt(): 获取某一位置的字符, 并判断他的字符码
      let sl = val.charCodeAt(i);
      if (sl >= 0 && sl <= 128) {
        l++
      } else {
        l += 2;
      }
    }
    if (ruleMain.test(val)) {
      if (l <= 64) {
        callback();
        this.props.form.setFieldsValue({brandName: val.trim()});
        document.querySelector('#brandName').value = val.trim();
      } else {
        callback('字符长度超过64位!')
      }
    } else if (val === '') {
      callback('')
    } else {
      callback('品牌名称为中文,韩文,英文,数字以及 ()（）-_ /,且不能包含空格')
    }
  }
  // 商品码验证
  productCodeValidator(rule, val, callback) {
    let ruleMain = new RegExp('^[a-zA-Z0-9]+$');
    if (ruleMain.test(val)) {
      if (val.length <= 20) {
        callback()
      } else {
        callback('商品码不能超过20位')
      }
    } else if (val === '') {
      callback()
    } else {
      callback('商品码为字母和数字组合')
    }
  }
  // 自定义表单验证返点率, 同时修正正确的显示值
  rebateRateValidator(rule, val, callback) {
    let rebateRate = parseFloat(document.querySelector('#rebateRate').value);
    let thisRule = /^\d+(\.\d{0,1})?$/;
    if (thisRule.test(val)) {
      if (parseFloat(val) >= 0 && parseFloat(val) <= 99.9) {
        callback();
        this.props.form.setFieldsValue({rebateRate: parseFloat(val)});
        document.querySelector('#rebateRate').value = rebateRate;
      } else {
        callback('返点率范围在0到100以内')
      }
    } else if (val === '') {
      this.props.form.setFieldsValue({rebateRate: 0});
      document.querySelector('#rebateRate').value = 0;
      callback()
    } else {
      callback('返点率最多保留一位小数')
    }
  }
  // 提交表单
  submitForm() {
    const { validateFields, } = this.props.form;
    const { modalType, modalEditData, } = this.state;
    validateFields((err, val) => {
      if (!err) {
        let dataList = val;
        if (modalType==='edit') {
          dataList.brandId = modalEditData.brandId;
          dataList.rebateId = modalEditData.rebateId
        }
        this.ajax.post('/rebate/insertOrUpdateRebate', dataList).then(r => {
          if (r.data.status === 10000) {
            message.success(r.data.msg);
            this.selectAllRebateByMallName();
            // 关闭弹窗
            this.closeModal();
          }
          r.showError();
        }).catch(r => {
          this.ajax.isReturnLogin(r,this);
        });
      }
    })
  }
  // 删除
  delete() {
    // console.log(record.rebateId);
    const {currentRecord} = this.state;
    const data = {rebateId: currentRecord.rebateId};
    this.ajax.post('/rebate/deleteBrandByRebateId', data).then(r => {
      if (r.data.status === 10000) {
        message.success(`${r.data.msg}`);
        this.selectAllRebateByMallName();
        this.setState({deleteModalVisible: false, currentRecord: {}});
      }
      r.showError();
    }).catch(r => {
      this.ajax.isReturnLogin(r, this);
    });
  }

  //导出Excel模板
  handleExport() {
    const elt = document.getElementById('tableList');
    const wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
    XLSX.writeFile(wb, `小票模板 ${moment(new Date()).format('YYYYMMDD-HHmmss')}.xlsx`);
  }

  //获取导入模板数据
  getExportDataList() {
    this.ajax.post('/rebate/findSgRebateToExcel').then(r=>{
      if(r.data.status === 10000){
        const {data} = r.data;
        this.setState({
          exportDataList:data
        })
      }
    })
  }

  columnsExport = [
    {title: '品牌表id',dataIndex: 'brandId', key: 'brandId'},
    {title: '品牌名称',dataIndex: 'brandName', key: 'brandName'},
    {title: '品牌类型',dataIndex: 'brandType', key: 'brandType',},
    {title: '商场', dataIndex: 'mallName', key: 'mallName'},
    {title: '返点表id', dataIndex: 'rebateId', key: 'rebateId'},
    {title: '返点率'},
  ]

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    // 表单标题
    const columns=[
      {title: '商场', dataIndex: 'mallName', key: 'mallName', width: 160},
      {title: '品牌', dataIndex: 'brandName', key: 'brandName', },
      {title: '商品码', dataIndex: 'productCode', key: 'productCode', width: 160},
      {title: '最近更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 200,
      render: (text, record) => (
          <div>{!!record.updateTime ?
            moment(record.updateTime).format('YYYY-MM-DD HH:mm:ss')
            : moment(record.createTime).format('YYYY-MM-DD HH:mm:ss')}</div>
      )
      },
      {title: '返点率', dataIndex: 'rebateRate', key: 'rebateRate', width: 100},
      {title: '操作', dataIndex: '操作', key: '操作', width: 160, fixed: 'right',
        render: (text, record) => (
          <div>
            <Button type="primary"
                    style={{'margin':0}}
                    onClick={this.allow(74) ? this.openEdit.bind(this,record) : null}
                    disabled={!this.allow(74)}
                    title={this.allow(74) ? null : '没有该操作权限'}
            >编辑</Button>
            <Button type="danger"
                    style={{'marginLeft':8}}
                    onClick={()=>{
                      if (this.allow(72)) this.setState({
                        deleteModalVisible: true,
                        currentRecord: record
                      }
                    )}}
                    disabled={!this.allow(72)}
                    title={this.allow(72) ? null : '没有该操作权限'}
            >删除</Button>
          </div>
        ),
      }
    ];
    const {shopList, currentShop, country, tableDataList, pageTotal, pageSize, pageSizeOptions, pageNum, deleteModalVisible, currentRecord, modalVisible, modalType, tableIsLoading,errorList,fileDate,input,importVisible,success,isImportOver,isImport,exportDataList} = this.state;
    const {getFieldDecorator} = this.props.form;
    return (
      <div className="setRebate contentMain">
        <div className="title">
          <div className="titleMain">设置返点</div>
          <div className="titleLine" />
        </div>
        <div className="shopSelect">
          <span>所属国家: </span>
          <Select className="selectShops"
                  placeholder="请选择国家"
                  onChange={this.selectCountry.bind(this)}
          >
            {this.state.countries}
          </Select>
          <span style={{marginLeft: 20}}>所属商场: </span>
          <Select className="selectShops"
                  placeholder="请选择商场"
                  value={currentShop}
                  onChange={this.selectShop.bind(this)}
          >
            {shopList}
          </Select>
        </div>

        <div className="btnLine">
          {this.allow(74) &&
            <Button className="createNew" type="primary"
                    onClick={this.openCreate.bind(this)}
            >新增品牌</Button>
          }
          {this.allow(74) &&
            <Button className="createNew" type="primary"
              onClick ={()=>{input.click()}}
            >导入excel</Button>
          }
          {this.allow(74) &&
            <Button className="createNew" type="primary"
            onClick={this.handleExport.bind(this)}
            >下载excel模板</Button>
          }

        </div>

        <Modal title="更新品牌返点表"
               className="importModal"
               visible={importVisible}
               onOk={()=>{ isImportOver ? 
                  (this.setState({importVisible:false,fileDate:[],success:0,Num:0}),
                  this.selectAllRebateByMallName())
                  :this.importExcel()}}
               onCancel={()=>{
                 isImport ? message.warn(`导入结束前请勿关闭页面`)
                 : this.setState({importVisible:false,Num:0,fileDate:[],errorList:[],success:0,})
               }}
               width={650}
        >
          <div>更新成功数据: {success}/{fileDate.length}</div>
          <div>更新错误数据:</div>
          {errorList.map((item,i) => (
            <div key={i}>{item.msg}, 错误码:{item.status}</div>
          ))}
          {errorList.length === 0 ? ''
            : <div style={{color:'rgba(255,0,0,.7)'}}>请留存错误数据, 以便处理失败单号</div>}
        </Modal>

        <div className="tableMain"
             style={{maxWidth: 1200}}
        >
          {/*表单*/}
          <Table className="tableList"
                 dataSource={tableDataList}
                 columns={columns}
                 pagination={false}
                 loading={tableIsLoading}
                 bordered
                 scroll={{ y: 500, x: 1000 }}
                 rowKey={(record, index) => `id_${index}`}
                 locale={{
                   emptyText: <div className="noShop">
                     {!country && <div className="noShopDiv"><Icon type="shop" className="iconShop"/><span>请选择国家</span></div>}
                     {country && !currentShop && <div className="noShopDiv"><Icon type="shop" className="iconShop"/><span>请选择商场</span></div>}
                   </div>,
                 }}
          />

          {/*分页*/}
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

          {/*导出用表单 NEW*/}
          <Table  
              id="tableList" 
              dataSource={exportDataList}
              columns={this.columnsExport}
              style={{display: 'none'}}
              rowKey={(record, index) => `id_${index}`}
              pagination={false}
          />
        </div>

        {/*删除弹窗*/}
        <Modal title="删除品牌"
               visible={deleteModalVisible}
               onCancel={()=>{this.setState({deleteModalVisible:false,currentRecord:{}})}}
               onOk={this.delete.bind(this)}
               okText="删除"
               okType="danger"
               cancelText="取消"
        >
          <p>是否删除{currentRecord.brandName}</p>
        </Modal>

        {/*弹窗*/}
        <Modal width={320}
               title={
                 <div style={{fontSize:20,textAlign:'center'}}>{modalType === 'create' ? '新增' : '编辑'}返点信息</div>
               }
               visible={modalVisible}
               onCancel={this.closeModal.bind(this)}
               centered
               wrapClassName="modalWrap"
               closable={false}
               footer={
                 <div style={{textAlign:'center'}}>
                   <Button type="primary" onClick={this.submitForm.bind(this)}>保存</Button>
                   <Button style={{marginLeft:20}} onClick={this.closeModal.bind(this)}>取消</Button>
                 </div>
               }
        >
          <Form>
            <FormItem label="商场名称"
                      colon
                      labelCol={{span: 7}}
                      wrapperCol={{span: 12}}
            >
              {getFieldDecorator('mallName', {
                rules: [{required: true, message: '请选择商场!'}],
              })(
                  <Select style={{width: 180}}
                          placeholder="请选择商场"
                  >
                    {shopList}
                  </Select>
              )}
            </FormItem>
            <FormItem label="品牌类型"
                      colon
                      labelCol={{span: 7}}
            >
              {getFieldDecorator('brandType', {
                rules: [{required: true}],
                initialValue: 1
              })(
                  <Select style={{width: 180}}
                  >
                    <Option key="普通品牌" value={0} >普通品牌</Option>
                    <Option key="特殊品牌" value={1} >特殊品牌</Option>
                  </Select>
              )}
            </FormItem>
            <FormItem label="品牌名称"
                      colon
                      labelCol={{span: 7}}
                      wrapperCol={{span: 12}}
                      validator={this.brandNameValidator}
            >
              {getFieldDecorator('brandName', {
                rules: [
                  {required: true, message: '请输入品牌名称!'},
                  {validator: this.brandNameValidator.bind(this)}
                ],
              })(
                  <Input style={{width: 180}}
                         placeholder="请输入品牌名称"
                  />
              )}
            </FormItem>
            <FormItem label="商品码"
                      colon
                      labelCol={{span: 7}}
                      wrapperCol={{span: 12}}
                      validator={this.productCodeValidator}
            >
              {getFieldDecorator('productCode', {
                rules: [
                  // {required: true, message: '请输入商品码!'},
                  {validator: this.productCodeValidator.bind(this)}
                ],
                initialValue: ''
              })(
                  <Input style={{width: 180}}
                         id="productCode"
                         placeholder="请输入商品码"
                  />
              )}
            </FormItem>
            <FormItem label="返点率"
                      colon
                      labelCol={{span: 7}}
                      wrapperCol={{span: 15}}
                      validator={this.rebateRateValidator}
            >
              {getFieldDecorator('rebateRate', {
                rules: [
                  {required: true, message: '请输入返点率!'},
                  {validator: this.rebateRateValidator.bind(this)}
                ],
                initialValue: 0
              })(
                  <Input style={{width: 60}}
                         type="number"
                         id="rebateRate"
                         // onChange={this.changeRebateRate.bind(this)}
                  />
              )}
            </FormItem>
          </Form>
        </Modal>
      </div>
    )
  }
}

export default setRebate;