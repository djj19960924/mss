import React from "react";
import {Table, Button, Modal, message, Input, DatePicker} from "antd";
import moment from "moment";
import "./index.less";

class PurchaseTrip extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // 行程列表
      tripList: [],
      //编辑行程modal
      editVisible: false,
      //删除modal
      deleteVisible: false,
      //选中的行程id
      tripId: null,
      //选中行程的采购地点
      purchaseAddress: null,
      //table加载loading
      tableLoading: false,
      //起始时间
      startTime: null,
      //结束时间
      endTime: null,
    };

  }

  componentWillMount() {
    this.getTripList();
  }

  // 获取行程列表
  getTripList() {
    this.setState({tableLoading: true})
    fetch(window.apiUrl + "/legworkBackend/getLegworkPurchaseAddress", {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    }).then(r => r.json()).then(res => {
      this.setState({tableLoading: false});
      if (res.status === 10000) {
        this.setState({tripList: res.data});
        message.success(res.msg);
      } else if (res.status === 10001) {
        message.warn(res.msg);
      } else {
        message.error(res.msg);
      }
    }).catch(r => {
      this.setState({tableLoading: false});
      console.error(r);
      console.log('前端接口调取错误')
    })
  }

  //获取起始时间
  getStartTime(date, dateString) {
    if (dateString !== "") {
      this.setState({startTime: dateString})
    }
  }

  //获取结束时间
  getEndTime(date, dateString) {
    if (dateString !== "") {
      this.setState({endTime: dateString})
    }
  }

  //获取采购地点
  getAddress(e) {
    this.setState({purchaseAddress: e.target.value});
  }

  // 显示编辑modal
  editTrip(id, purchaseAddress, startTime, endTime) {
    this.setState({
      tripId: id,
      purchaseAddress: purchaseAddress,
      startTime: startTime,
      endTime: endTime,
      editVisible: true,
      deleteVisible: false
    })
  }

  //确定编辑
  editOk() {
    const {tripId, purchaseAddress, startTime, endTime} = this.state;
    if (tripId) {
      if (purchaseAddress && startTime && endTime) {
        let data = {
          id: tripId,
          purchaseAddress: purchaseAddress,
          startingTime: startTime,
          endTime: endTime
        };
        this.setState({tableLoading: true});
        fetch(window.apiUrl + "/legworkBackend/updateLegworkPurchaseAddress", {
          method: "post",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(data)
        }).then(r => r.json()).then((res) => {
          this.setState({tableLoading: false});
          if (res.status === 10000) {
            message.success(res.msg);
            this.setState({
              tripId: null,
              purchaseAddress: null,
              startingTime: null,
              endTime: null,
              editVisible: false,
              deleteVisible: false
            });
            this.getTripList();
          } else if (res.status === 10001) {
            message.warn(res.msg)
          } else {
            message.error(res.msg);
          }
        }).catch(r => {
          this.setState({tableLoading: false});
          console.error(r);
          console.log('前端接口调取错误')
        })
      } else {
        message.warn("请将信息填写完整");
      }
    } else {
      //没有获取到tripId
      message.error("网络错误,请刷新页面");
    }


  }

  //取消编辑
  editCancel() {
    this.setState({
      tripId: null,
      purchaseAddress: null,
      startTime: null,
      endTime: null,
      editVisible: false,
      deleteVisible: false
    })
  }

  //显示删除modal
  deleteTrip(id,purchaseAddress,startTime,endTime) {
    this.setState({
      tripId: id,
      purchaseAddress: purchaseAddress,
      startTime: startTime,
      endTime: endTime,
      editVisible: false,
      deleteVisible: true
    })
  }

//确定删除
  deleteOk() {
    this.setState({tableLoading: true});
    fetch(window.apiUrl+"/legworkBackend/setPurchaseAddressUnshow",{
      method:'post',
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({id:this.state.tripId})
    }).then(r=>r.json()).then(res=>{
      this.setState({tableLoading: false});
      if(res.status===10000){
        message.success(res.msg);
        this.setState({
          tripId: null,
          purchaseAddress: null,
          startTime: null,
          endTime: null,
          editVisible: false,
          deleteVisible: false
        })
        this.getTripList();
      }else if(res.status===10001){
        //没有获取到tripId
        message.error("网络错误请关闭重试")
      }else{
        message.error(res.msg);
      }
    }).catch(r => {
      this.setState({tableLoading: false});
      console.error(r);
      console.log('前端接口调取错误')
    })
  }

  //取消删除
  deleteCancel() {
    this.setState({
      tripId: null,
      purchaseAddress: null,
      startTime: null,
      endTime: null,
      editVisible: false,
      deleteVisible: false
    })
  }

  render() {
    const {tripList, editVisible, deleteVisible, tableLoading, purchaseAddress, startTime, endTime} = this.state;
    const columns = [{
      title: "采购地点",
      dataIndex: "purchaseAddress",
      key: 'purchaseAddress',
      width: 150
    },
      {
        title: "起始时间",
        dataIndex: "startingTime",
        key: 'startingTime',
        width: 150
      },
      {
        title: "结束时间",
        dataIndex: "endTime",
        key: 'endTime',
        width: 150
      },
      {
        title: "操作",
        dataIndex: "id",
        key: 'id',
        width: 150,
        render: (text, record) => (
          <div>
            <Button type="primary"
                    onClick={this.editTrip.bind(this, record.id, record.purchaseAddress, record.startingTime, record.endTime)}>编辑</Button>
            <Button type="danger" disabled={!record.purchaseAddress}
                    onClick={this.deleteTrip.bind(this, record.id, record.purchaseAddress, record.startingTime, record.endTime)}
                    style={{"marginLeft": 10}}>删除</Button>
          </div>
        )
      },
    ];
    return (
      <div className="purchase-trip ">
        <div className="tableMain">
          <Table className="tableList"
                 bordered
                 columns={columns}
                 dataSource={tripList}
                 loading={tableLoading}
                 pagination={false}
                 rowKey={(record, index) => `${record.id}`}
                 scroll={{x: 960, y: 800}}
          />
        </div>

        <Modal title="编辑该行程"
               visible={editVisible}
               closable={false}
               wrapClassName="globalErrandsModal-trip"
               centered
               destroyOnClose
               okText={"保存"}
               onOk={this.editOk.bind(this)}
               onCancel={this.editCancel.bind(this)}>
          <div className="editInfo">
            <p>采购地点</p>
            <Input type="text" value={purchaseAddress} onChange={this.getAddress.bind(this)}/>
          </div>
          <div className="editInfo">
            <p>起始时间</p>
            <DatePicker onChange={this.getStartTime.bind(this)} value={startTime ? moment(startTime, "MM.DD") : null} format="MM.DD"/>
          </div>
          <div className="editInfo">
            <p>结束时间</p>
            <DatePicker onChange={this.getEndTime.bind(this)} value={endTime ? moment(endTime, "MM.DD") : null} format="MM.DD" />
          </div>
        </Modal>
        <Modal title="删除该行程"
               visible={deleteVisible}
               closable={false}
               wrapClassName="globalErrandsModal-trip"
               centered
               destroyOnClose
               okText={"狠心删除"}
               onOk={this.deleteOk.bind(this)}
               onCancel={this.deleteCancel.bind(this)}>
          <p>是否将从{startTime}到{endTime}去往{purchaseAddress}的行程删除</p>
        </Modal>
      </div>
    );
  }
}


export default PurchaseTrip;