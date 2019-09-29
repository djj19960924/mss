import React from 'react';
import {Button, DatePicker, Icon, Input, InputNumber, message, Select, Radio, notification, Badge, Modal} from 'antd';
import moment from 'moment';
import ImageViewer from '@components/imageViewer/main';
import AuditTicketModel from './components/auditTicketModel/';
import CostCalculationModel from './components/costCalculationModel/';
import {inject, observer} from 'mobx-react/index';
import './index.less';

@inject('appStore') @observer
class auditTicket extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 自营/客户类型 1:自营,0:客户
      checkChoice: 1,
      // 图片宽高依赖
      previewImageWH: 'width',
      // 图片弹窗
      showImageViewer: false,
      // 当前图片地址
      imgUrl: '',
      // 存放小票上传接口所需数据
      auditTicketInfo: {},
      // 存放成本核算所需数据
      costCalculationInfo: {},
      // 剩余小票张数
      receiptTotal: 0,
      // 折扣率
      discountRate: 100,
      // 返点率
      rebateRate: 0,
      // 国家
      country: '',
      koreaRate:0,
      americaRate:0,
    };
  }

  // 子组件存放
  AuditTicketModelRef = undefined;
  CostCalculationModelRef = undefined;

  componentDidMount() {
    this.imgHandle()
  }

  // 处理图片加载完成事件
  imgHandle() {
    document.querySelector('.previewImage').onload = () => {
      let pI = document.querySelector('.previewImage');
      const data = {imgLoading: false};
      if ((pI.width / pI.height) < (400 / 550)) {
        data.previewImageWH = 'height';
      } else if ((pI.width / pI.height) >= (400 / 550)) {
        data.previewImageWH = 'width';
      }
      this.setState(data);
    };
  }

  // 获取小票相关数据
  changeReceiptInfo(object) {
    this.setState(object)
  }
  // 获取成本相关数据
  changeCostInfo(object) {
    this.setState(object)
  }

  // 驳回小票弹窗
  reciptRejected() {
    const {receiptList, currentReceiptNo} = this.AuditTicketModelRef.state;
    const RadioGroup = Radio.Group;
    const radioStyle = {
      display: 'block',
      height: '30px',
      lineHeight: '30px',
    };
    let RadioGroupValue = undefined, other = '';
    const checkReciptRejected = e => {
      // 去除自动关闭事件
      e = () => {};
      const {reciptId} = receiptList[currentReceiptNo];
      const data = {reciptId, note: RadioGroupValue === 3 ? `3${other}` : RadioGroupValue};
      if (!RadioGroupValue) {
        message.error('请选择驳回原因')
      } else {
        if (RadioGroupValue === 3 && !other) {
          message.error('其他原因不能为空')
        } else {
          this.ajax.post('/recipt/checkReciptRejected', data).then(r => {
            const {status, msg} = r.data;
            if (status === 10000) {
              message.success(msg);
              this.checkRecipt();
              modal.destroy();
            }
            r.showError();
          }).catch(r => {
            console.error(r);
            this.ajax.isReturnLogin(r, this);
          });
        }
      }
    };
    const modal = Modal.confirm({
      icon: 'frown',
      title: '驳回小票',
      onOk: checkReciptRejected,
      content: <div>
        <RadioGroup onChange={e => {RadioGroupValue = e.target.value}}
        >
          <Radio value={0}
                 style={radioStyle}
          >小票不清晰</Radio>
          <Radio value={1}
                 style={radioStyle}
          >凭证号不正确</Radio>
          <Radio value={2}
                 style={radioStyle}
          >小票重复提交</Radio>
          <Radio value={4}
                 style={radioStyle}
          >小票不完整</Radio>
          <Radio value={3}
                 style={radioStyle}
          >其他</Radio>
        </RadioGroup>
        <Input.TextArea placeholder="请输入原因" onChange={e => {other = e.target.value}}/>
      </div>
    })
  }
  // 通过小票
  reciptAllow() {
    // OK事件
    const checkReciptAllow = e => {
      const ajaxPost = data => this.ajax.post('/recipt/checkReciptAllow', data).then(r => {
        const {status, msg} = r.data;
        if (status === 10000) {
          message.success(msg);
          modal.destroy();
          this.checkRecipt();
          this.AuditTicketModelRef.props.form.resetFields();
          // 自营时恢复
          if (checkChoice === 1) {
            const productCosts = [{
              // 商品名称
              productName: '',
              // 商品单价
              unitPrice: undefined,
              // 商品数量
              number: undefined,
              // 成本
              cost: undefined,
              // 商品id
              productId: undefined
            }];
            const productInfoList = [];
            this.CostCalculationModelRef.setState({productCosts, productInfoList});
          }
        }
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
      // 去除自动关闭事件
      e = () => {};
      const {checkChoice,country} = this.state;
      const {receiptList, currentReceiptNo} = this.AuditTicketModelRef.state;
      // 从审核小票模块获取 unionId reciptId
      const {unionId, reciptId} = receiptList[currentReceiptNo];
      // 审核组件
      this.AuditTicketModelRef.props.form.validateFields((err, val) => {
        if (!err) {
          const data = {unionId, reciptId};
          Object.assign(data, val);
          // 处理 日期, 小票状态, 审核选择(是否自营)
          data.consumeDate = moment(val.consumeDate).format('YYYY-MM-DD');
          if (val.reciptAttribute === 'SG') {
            data.status = 0
          } else if (val.reciptAttribute === 'MG') {
            data.status = 1
          }else{
            data.status = null
          }
          data.checkChoice = checkChoice;
          console.log('data11',data);
          // 判断自营小票
          if (checkChoice === 1) {
            if (country==="韩国") {
              // 自营小票
              const {productCosts} = this.CostCalculationModelRef.state;
              // 判断成本计算模块填写情况
              let costValidateState = false, totalPrice = 0;
              for (let obj of productCosts) {
                totalPrice += (obj.unitPrice * obj.number);
                for (let name in obj) {
                  if (!obj[name]) costValidateState = true;
                }
              }
              if (costValidateState) {
                message.error('成本计算模块有商品数据尚未填写')
              } else if(totalPrice !== data.originalPrice) {
                message.error('商品价格总和与原价美金不相等')
              } else {
                // 自营通过验证
                // 基础 data 已包含折扣率
                var rate = localStorage.getItem("rate")
                Object.assign(data,{productCosts, rate});
                // debugger
                console.log('data1:',data)
                ajaxPost(data);
              }
            } else {
              var rate = localStorage.getItem("rate")
              Object.assign(data,{rate}); 
              console.log('data2:',data)
              ajaxPost(data);
            }
          } else {
            var rate = localStorage.getItem("rate")
            Object.assign(data,{rate});
            console.log('data3:',data)
            // 客户小票
            ajaxPost(data);
          }
        } else {
          message.error('小票审核模块有数据数据尚未填写');
        }
      });
    };
    const modal = Modal.confirm({
      icon: 'smile',
      title: '通过小票',
      onOk: checkReciptAllow,
      content: <div></div>
    })
  }

  // 成功处理一张小票
  checkRecipt() {
    const {receiptList, currentReceiptNo, receiptTotal} = this.AuditTicketModelRef.state;
    if (currentReceiptNo === (receiptList.length - 1)) {
      // 获取新的小票
      this.AuditTicketModelRef.getReciptByMallName();
    } else {
      this.AuditTicketModelRef.setState({currentReceiptNo: currentReceiptNo + 1});
      this.setState({imgUrl: receiptList[currentReceiptNo+1].pictureUrl, receiptTotal: receiptTotal - 1})
    }
  }

  componentWillUnmount() {this.setState = () => null}
  render() {
    const RadioGroup = Radio.Group;
    const RadioButton = Radio.Button;
    const {showImageViewer, imgLoading, checkChoice, previewImageWH, imgUrl, receiptTotal, discountRate, rebateRate, country} = this.state;
    return (
      <div className="auditTicket contentMain">
        <div className="title">
          <div className="titleMain">审核小票</div>
          <div className="titleLine" />
        </div>

        <div className="containerMain">
          {/*图片模块*/}
          <div className="imgMain">
            <div className="imgBody">
              {imgLoading &&
              <div className="loadingShow">
                <p className="loadingTxt"><Icon type="loading" /> 图片加载中, 请稍后...</p>
              </div>
              }
              {/*单图片功能*/}
              <img className="previewImage"
                   src={imgUrl}
                   alt=""
                   // 打开图片弹窗
                   onClick={() => {
                     this.setState({showImageViewer: true})
                   }}
                   style={{
                     width: previewImageWH === 'width' ? '100%' : 'auto',
                     height: previewImageWH === 'height' ? '100%' : 'auto',
                   }}
              />
            </div>
          </div>
          {/*表单模块*/}
          <div className="fromMain">
            {/*类型选择*/}
            <div className="btnLine">
              <RadioGroup value={checkChoice}
                          onChange={e => this.setState({checkChoice: e.target.value})}
              >
                <RadioButton value={1}>自营小票</RadioButton>
                <RadioButton value={0}>客户小票</RadioButton>
              </RadioGroup>
            </div>
            <div className="leftInfo">剩余小票张数: {receiptTotal}张</div>
            {/*小票审核部分*/}
            <AuditTicketModel checkChoice={checkChoice}
                              changeReceiptInfo={this.changeReceiptInfo.bind(this)}
                              onRef={ref => {this.AuditTicketModelRef = ref}}
            />
            {/*成本核算部分*/}
            <CostCalculationModel checkChoice={checkChoice}
                                  receiptTotal={receiptTotal}
                                  discountRate={discountRate}
                                  rebateRate={rebateRate}
                                  country={country}
                                  changeCostInfo={this.changeCostInfo.bind(this)}
                                  onRef={ref => {this.CostCalculationModelRef = ref}}
            />
          </div>
        </div>

        <div className="btnLine">
          <Button type="primary"
                  style={{marginLeft: 100}}
                  onClick={this.reciptAllow.bind(this)}
                  disabled={this.AuditTicketModelRef ? this.AuditTicketModelRef.state.receiptList.length === 0 : false}
          >通过审核</Button>
          <Button type="danger"
                  style={{marginLeft: 10}}
                  onClick={this.reciptRejected.bind(this)}
                  disabled={this.AuditTicketModelRef ? this.AuditTicketModelRef.state.receiptList.length === 0 : false}
          >驳回小票</Button>
        </div>

         {/*图片查看弹窗组件*/}
        {showImageViewer &&
        <ImageViewer // 图片链接, 上为图片查看器开关
          imgSrc={imgUrl}
          // 关闭图片查看
          closeImageViewer={() => this.setState({showImageViewer: false,})}
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
      </div>
    )
  }
}

export default auditTicket;