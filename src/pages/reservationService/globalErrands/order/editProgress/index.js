import React from "react";
import "./index.less";
import moment from "moment";
import ImageViewer from '@components/imageViewer/main';
import {Button, Modal, Input, message} from "antd";

class EditProgress extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // 图片查看器开关
      showImageViewer: false,
      //商品链接(大图用)
      imgSrc: null,
      //预订时间
      bookingTime: null,
      //微信号
      wechatNo: null,
      //商品内容
      commodityContent: null,
      //商品图片列表
      commodityImgList: [],
      //订单进度
      schedules: [],
      //增加进度modal显示
      addVisible: false,
      //更新内容
      updateContent: null,
      //更新图片
      updateImg: null,
      //更新图片file
      updateImgFile: null,
      //确认更新按钮loading
      btnLoading: false,
      //删除进度id
      deleteId: null,
      //订单是否完结
      isEnd: null
    };


  }

  componentWillMount() {
    this.getOrderProgressDetail();
  }

  //获取订单信息
  getOrderProgressDetail() {
    fetch(window.apiUrl + "/legworkBackend/getProductDetailAndSchedule", {
      method: "post",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({id: window.getQueryString("id")})
    }).then(r => r.json()).then(res => {
      if (res.status === 10000|| res.status===9999) {
        let data = res.data;
        this.setState({
          bookingTime: data.createTime,
          wechatNo: data.wechatNo,
          commodityContent: data.productName,
          schedules: data.legworkSchedules,
          isEnd: data.isEnd
        });
        if (data.legworkImgList) {
          this.setState({commodityImgList: data.legworkImgList})
        }
        if(res.status===9999){
          message.warn(res.msg);
        }
      }else if(res.status){
        message.error(res.msg);
      }else{
        message.error('全球跑腿进度后端数据返回错误');
      }
    }).catch(r => {
      console.error(r);
      console.log('全球跑腿进度接口前端你调取错误')
    })
  }

  //显示增加进度modal
  addProgress() {
    this.setState({addVisible: true})
  }

  //确定添加进度
  sureInfo() {
    const {updateImgFile} = this.state;
    this.setState({btnLoading: true});
    if (updateImgFile) {
      let formData = new FormData();
      formData.append("files", updateImgFile);
      fetch(window.apiUrl + "/legworkImg/legworkImgUpload", {
        method: "post",
        body: formData
      }).then(r => r.json()).then(res => {
        if (res.code === 2000) {
          this.setState({updateImg: res.imgList[0]});
          this.submitProgressInfo(res.imgList[0]);
        }
      }).catch(r => {
        console.error(r);
        console.log('添加进度接口调取错误')
      })
    } else {
      this.submitProgressInfo();
    }

  }

  //提交进度信息
  submitProgressInfo(img) {
    const {updateContent} = this.state;
    fetch(window.apiUrl + "/legworkBackend/submitLegworkSchedule", {
      method: "post",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({legworkId: window.getQueryString("id"), scheduleInfo: updateContent, scheduleUrl: img})
    }).then(r => r.json()).then(res => {
      this.setState({btnLoading: false});
      if (res.status === 10000) {
        this.setState({addVisible: false, updateImg: null, updateImgFile: null, updateContent: null})
        message.success(res.msg);
        this.getOrderProgressDetail();
      } else {
        message.error(res.msg)
      }
    }).catch(r => {
      console.error(r);
      console.log('前端接口调取错误')
    })
  }

  //文件格式转url
  getObjectURL(file) {
    let url = null;
    if (file !== undefined) {
      if (window.createObjectURL !== undefined) { // basic
        url = window.createObjectURL(file);
      } else if (window.URL !== undefined) { // mozilla(firefox)
        url = window.URL.createObjectURL(file);
      }
    }
    return url;
  }

  //删除一条进度显示modal
  deleteProgress(id) {
    this.setState({deleteVisible: true, deleteId: id});
  }

  //确定删除
  deleteOk() {
    fetch(window.apiUrl + "/legworkBackend/delLegworkSchedule", {
      method: "post",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({id: this.state.deleteId, legworkId: window.getQueryString("id")})
    }).then(r => r.json()).then(res => {
      if (res.status === 10000) {
        message.success(res.msg)
        this.getOrderProgressDetail();
        this.setState({deleteId: null, deleteVisible: false})
      } else {
        message.error(res.msg);
      }
    }).catch(r => {
      console.error(r);
      console.log('前端接口调取错误')
    })
  }

  componentWillUnmount() {
    this.setState = () => null
  }

  render() {
    const {bookingTime, wechatNo, commodityContent, commodityImgList, schedules, addVisible, updateContent, updateImg, btnLoading, deleteVisible, showImageViewer, imgSrc,isEnd} = this.state;
    return (
      <div className="edit-progress">
        <h1>编辑采购进度</h1>
        <p>预订时间:{moment(bookingTime).format("YYYY-MM-DD HH:mm:ss")}</p>
        <p>微信号:{wechatNo}</p>
        <p>商品内容:{commodityContent}</p>
        <div className="commodity">
          {
            commodityImgList && commodityImgList.map(
              (item, index) => {
                return (
                  <div className="commodity-img" key={index}>
                    <img src={item} className="img-list" onClick={() => {
                      this.setState({showImageViewer: true, imgSrc: item})
                    }}/>
                  </div>
                )
              }
            )
          }
        </div>
        {/* 图片查看弹窗组件 */}
        {showImageViewer &&
        <ImageViewer // 图片链接, 上为图片查看器开关
          imgSrc={!!imgSrc ? imgSrc : ''}
          // 关闭图片查看
          closeImageViewer={() => this.setState({showImageViewer: false, imgSrc: null})}
          option={{
            // 添加图片拖拽功能
            move: true,
            // 添加图片旋转功能
            rotate: true,
            // 添加鼠标滚轮放大缩小功能
            zoom: true,
            // 添加遮罩层, 点击遮罩层可以关闭图片预览
            shadow: false,
          }}
        />}
        <p className="schedules">采购进度</p>
        {
          schedules && schedules.map(
            (item, index) => {
              return (
                <div key={index} className="schedules-info">
                  <div className="schedules-info-left">
                    <p>更新时间:{moment(item.updateTime).format("YYYY-MM-DD HH:mm:ss")}</p>
                    <p>更新内容: {item.scheduleInfo}</p>
                    {item.scheduleUrl &&
                    <div className="schedules-img">
                      <img src={item.scheduleUrl} alt=""/>
                    </div>
                    }
                  </div>
                  {
                    isEnd===0 &&  <Button type="danger" onClick={this.deleteProgress.bind(this, item.id)}>删除</Button>
                  }

                </div>
              )
            }
          )
        }
        {
          isEnd===0 && <Button className="add-progress" type="primary" ghost size={"large"}
                               onClick={this.addProgress.bind(this)}>+增加进度</Button>
        }

        {/*增加进度*/}
        <Modal centered
               closable={false}
               visible={addVisible}
               wrapClassName="globalErrandsModal-edit"
               destroyOnClose
               footer={[
                 <Button key="ok" type="primary" onClick={this.sureInfo.bind(this)} loading={btnLoading}>确定</Button>,
                 <Button key="cancel" onClick={() => {
                   this.setState({addVisible: false, updateImg: null, updateImgFile: null, updateContent: null})
                 }}>取消</Button>
               ]}
        >
          <Input placeholder="请输入要更新的内容" value={updateContent} onChange={(e) => {
            this.setState({updateContent: e.target.value})
          }}/>
          <div className="update-img">
            <img src={updateImg ? updateImg : "//resource.maishoumiji.com/globalErrands/add-img.jpg"} alt=""/>
            <Input className="input-file" type="file" accept="image/*" onChange={(e) => {
              let file = e.target.files[0];
              if (file) {
                let url = this.getObjectURL(file);
                this.setState({updateImg: url, updateImgFile: file})
              }
            }}/>
            <div>
              <p>最多上传一张图片,可不上传</p>
              <p>(再次点击可重新选择图片)</p>
            </div>
          </div>
        </Modal>
        <Modal centered
               closable={false}
               visible={deleteVisible}
               destroyOnClose
               wrapClassName="globalErrandsModal-edit"
               onOk={this.deleteOk.bind(this)}
               onCancel={() => {
                 this.setState({deleteVisible: false, deleteId: null})
               }}
        >
          <p>请再次确认是否删除该进度</p>
        </Modal>
        <div>
          <Button className="return-purchasing" type="primary" size="large" onClick={() => {
            this.props.history.push("/reservation-service/global-errands/order?contentType="+window.getQueryString("contentType"))
          }}>{window.getQueryString("contentType")=== "0" ? "返回等待采购页面" :"返回采购结束页面"}</Button>
        </div>
      </div>
    );
  }
}


export default EditProgress;