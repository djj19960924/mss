import React from 'react';
import {Radio, Button, Table, message,Pagination} from 'antd';
import './index.less';

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
      tableLoading: false,
      pageNum: 1,
      pageSize: 100,
      pageTotal:0
    }
  }
  componentDidMount() {
    this.getOrderInfo(0);
  }

  getOrderInfo(status=this.state.status,pageNum=this.state.pageNum,pageSize=this.state.pageSize) {
    this.setState({tableLoading:true});
    // 待改造
    return false;
    fetch(window.apiUrl + "/Yto/backendIsYto", {
      method: "post",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: "isYto=" + status+"&pageNum="+pageNum+"&pageSize="+pageSize
    }).then(r => r.json()).then((res) => {
      if (!res.msg && !res.data) {
        message.error(`后端数据错误`)
      } else {
        if (res.status === 10000) {
          for(let i=0 ; i<res.data.list.length;i++){
            res.data.list[i].createTime=this.formatDate(res.data.list[i].createTime);
          }
          //message.success(`${res.msg}`)
          this.setState({data: res.data.list, selectedList: [], selectedIds: [],pageTotal:res.data.total, pageSizeOptions: [`100`,`200`,`500`,`${res.data.total > 1000 ? res.data.total : 1000}`]})
        } else {
          if(res.status===10002){
            message.warning(`${res.status}:${res.msg}`)
            this.setState({data:[]});
          }else{
            message.error(`${res.status}:${res.msg}`)
            this.setState({data:[]});
          }
        }
      }
      this.setState({tableLoading:false});
    }).catch(()=>{
      message.error(`前端接口调取错误`);
      this.setState({tableLoading:false});
    })
  }

  logisticsStatus(e) {
    // console.log(e.target.value);
    if (this.state.status !== e.target.value) {
      this.setState({status: e.target.value,tableLoading:true});
      this.getOrderInfo(e.target.value);
      if(e.target.value===1) this.setState({selectedIds:[]})
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

  // 上传
  uploadOrder (){
    this.setState({tableIsLoading:true});
    let selectNo=[];
    for(let i=0;i<this.state.selectedIds.length;i++){
      selectNo[i]=this.state.selectedIds[i].split(":")[1];
    }
    fetch(window.apiUrl+"/portal/speedexpressYto/uploadSelectSktToYto",{
      method:"post",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(selectNo)
    }).then(r=>r.json()).then((res)=>{
      if(res.status===10000){
        this.getOrderInfo(0);
        if(res.data.FailList.length===0){
          message.success(`${res.msg}`);
          this.setState({selectedIds:[]})
        }else{
          message.error(`箱号为${res.data.FailList.join(",")}的箱子上传失败`)
        }

      }else{
        message.error(`${res.status}:${res.msg}`)
      }
    })
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const columns = [
      {title: "箱号", dataIndex: "parcelNo", key: "parcelNo",width:130},
      {title: "商品名称", dataIndex: "productName", key: "productName",width:200},
      {title: "收件人姓名", dataIndex: "recipientsName", key: "recipientsName",width:100},
      {title: "收件人手机", dataIndex: "recipientsPhone", key: "recipientsPhone",width:140},
      {title: "收件人省份", dataIndex: "recipientsProvince", key: "recipientsProvince",width:100},
      {title: "收件人城市", dataIndex: "recipientsCity", key: "recipientsCity",width:100},
      {title: "收件人区", dataIndex: "recipientsDistrict", key: "recipientsDistrict",width:100},
      {title: "收件人详细地址", dataIndex: "recipientsAddress", key: "recipientsAddress"},
      {title: "用户微信昵称", dataIndex: "wechatName", key: "wechatName",width:100},
      {title: "数量", dataIndex: "productNum", key: "productNum",width:50},
      {title: "包裹创建时间", dataIndex: "createTime", key: "createTime",width:130}
    ];
    const columns1 = [
      {title: "绑定的面单号", dataIndex: "mailNo", key: "mailNo",width:130}
    ];
    columns1.push(...columns);
    const RadioButton = Radio.Button, RadioGroup = Radio.Group;
    return (
      <div className="SKTYto">
        <RadioGroup buttonStyle="solid"
                    className="radioBtn"
                    value={this.state.status}
                    onChange={this.logisticsStatus.bind(this)}
        >
          <RadioButton value={0}>待上传</RadioButton>
          <RadioButton value={1}>已上传</RadioButton>
        </RadioGroup>
        <Button type="primary"
                disabled={this.state.selectedIds.length === 0}
                onClick={this.uploadOrder.bind(this)}
        >发送所选订单</Button>
        <Table className="tableList"
               columns={this.state.status === 0 ? columns : columns1}
               dataSource={this.state.data}
               rowSelection={this.state.status === 0 ? {
                 selectedRowKeys: this.state.selectedIds,
                 // 选择框变化时触发c
                 onChange: (selectedRowKeys, selectedRows) => {
                   this.setState({selectedIds: selectedRowKeys});
                   // console.log(selectedRowKeys)
                 },
               } : null}
               bordered
               loading={this.state.tableLoading}
               pagination={false}
               scroll={{ x:1600, y: 500 }}
               rowKey={(record, index) => `id:${record.parcelNo}`}/>
        <Pagination className="tablePagination"
                    total={this.state.pageTotal}
                    pageSize={this.state.pageSize}
                    current={this.state.pageNum}
                    showTotal={(total, range) =>
                      `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 ` }共 ${total} 条记录`
                    }
                    onChange={this.changePage.bind(this)}
                    showSizeChanger
                    pageSizeOptions={this.state.pageSizeOptions}
                    onShowSizeChange={this.changePage.bind(this)}
        />
      </div>
    );
  }
}

export default SKTYto;