import React from 'react';
import { Button, Form, Select, Input, Upload, message, Icon, Modal, } from 'antd';
import {inject, observer} from 'mobx-react/index';

import './index.less';

const FormItem = Form.Item;
const Option = Select.Option;

@inject('appStore') @observer @Form.create()
class commoditiesCreateAndEdit extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      // 图片文件
      fileList: [],
      // 摄像头弹窗
      cameraModalVisible: false,
      // 拍照file暂存
      // cameraFileOrigin: {},
      // 照片暂存数据
      cameraFileData: {},
      // 照片自增uid
      cameraUid: 0,
      // 图片预览
      previewVisible: false,
      previewImage: '',
      // 是否可以拍照和保存
      hasCamera: false,
      // 标题显示
      titleName: '录入',
      // 判断图片是否过大
      isFileTooLarge: false,
      // 货币类型
      currencyType: 0,
    };
    window.commoditiesCreateAndEdit = this;
  }
  // 组件加载前触发
  componentWillMount() {
    const type = window.getQueryString('type');
    const skuId = window.getQueryString('skuId');
    if (type === 'create') {
      this.setState({
        titleName: '录入'
      });
    } else if (type === 'edit') {
      this.setState({
        titleName: '编辑'
      });
      // 这里根据 skuId 去调取商品信息接口
      // console.log(`skuId: ${skuId}`);
      fetch(`${window.fandianUrl}/sku/selectEditSkuBySkuId`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body:`skuId=${skuId}`,
      }).then(r => r.json()).then(r => {
        console.log(r)
      })
    } else {
      message.error('错误的商品处理类型, 即将返回商品库页面!');
      this.backTo();
    }
  }
  // 组件渲染值完成以后触发
  componentDidUpdate() {
    const { cameraModalVisible, isFileTooLarge, } = this.state;
    // 这里根据摄像头页面弹出渲染完成以后, 触发调取摄像头
    if (cameraModalVisible) this.getMedia();
    if (isFileTooLarge) message.error('单个文件大小不能超过10m');
  }
  // 返回上一个界面
  backTo() {
    // this.props.history.goBack()
    // 输入准确地址, 以保证返回按钮只能回到具体页面
    this.props.history.push('/commodities-manage/commodities-database')
  }
  // 查看图片
  imagePreview(file) {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  }
  // 关闭图片预览
  closePreview() {
    this.setState({
      previewVisible: false,
    })
  }
  // 图片改变时触发
  imageChange(f){
    // 这里用于恢复 isFileTooLarge 状态
    this.state.isFileTooLarge = false;
    var dataList = [];
    for (let i of f.fileList) {
      // 这里对 this.state 进行直接赋值, 是实时操作的, 且不会触发 render 的渲染
      // 这里的 size 单位为b, 需要进行数值操作
      if (i.size > ( 1024 * 1024 * 10 )) this.state.isFileTooLarge = true;
    }
    if (!this.state.isFileTooLarge) {
      if (f.fileList.length > 0) {
        // 多文件上传时, 会多次触发此方法
        // 当 fileList 列表最后一个 file 被赋予 uid 时, 则表示本次多文件上传即将结束
        // 所以根据 fileList 列表最后一个文件是否有 uid 来进行 fileList 赋值
        // 理论上而言, 上传文件时应当且实际只操作了一次 dataList 变化
        // 这里虽然重复申明了 setState , 但是可以保证多文件上传的同时, 实际上也只进行了一次操作
        if (!!f.fileList[f.fileList.length-1].uid) {
          if (f.fileList.length > 3) {
            for (let i in f.fileList) {
              if (i < 3) {
                dataList.push(f.fileList[i])
              }
            }
            message.warning('最多上传3个文件!');
            this.setState({ fileList: dataList });
          } else {
            dataList = f.fileList;
            this.setState({ fileList: dataList });
          }
        }
      } else {
        dataList = f.fileList;
        this.setState({ fileList: dataList });
      }
    } else {
      // 这里更新 isFileTooLarge 的值, 会更新 state 并触发 componentDidUpdate
      // 实际上在之前已经对该值进行了修正, 这里仅用作触发渲染
      // 虽然会多次 setState , 但实际上 setState 的机制并不会重复渲染, 而是统合同一时间的事件, 再同时渲染
      // 虽然不是官方做法, 但是可以成功只在渲染结束以后调取一次文件超出10m的提示
      this.setState({isFileTooLarge: true});
      // 当上传单个文件超过10m或文件列表中有任意文件大于10m时, 列表不予更新, 并且在渲染完成以后进行warn提示
    }
  }
  // 打开摄像头弹窗
  openCamera() {
    this.setState(
      { cameraModalVisible: true },
      // () => {this.getMedia()}
    )
  }
  // 关闭摄像头弹窗
  closeCamera() {
    this.setState({
      cameraModalVisible: false,
    });
    // 关闭弹窗的同时暂停视频播放
    document.getElementById("video").pause()
  }
  // 获取摄像头
  getMedia() {
    let constraints = {
      video: {width: 480, height: 360},
      audio: true
    };
    // 获取摄像头内容,显示在video中
    let promise = navigator.mediaDevices.getUserMedia(constraints);
    promise.then(function(MediaStream) {
      document.getElementById("video").srcObject = MediaStream;
      document.getElementById("video").play();
    }).catch(function() {
      message.error('调取摄像头失败, 请确保电脑已经成功链接摄像头, 并通过浏览器调用摄像头的申请!')
    })
  }
  // 拍照
  takePhoto() {
    //获得Canvas对象
    let video = document.getElementById("video");
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 480, 360);
    let file = this.dataURLtoFile(canvas.toDataURL("image/jpeg"),'照片.jpg');
    this.setState({
      cameraFileData: {
        thumbUrl: canvas.toDataURL("image/jpeg"),
        uid: `upload-photo-${this.state.cameraUid}`,
        originFileObj: file,
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate,
        name: file.name,
        percent: file.percent,
        size: file.size,
        type: file.type,
      },
      cameraUid: this.state.cameraUid + 1
    })
  }
  // base64码转为file方法
  dataURLtoFile(dataUrl, filename) {
    let arr = dataUrl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
  // 添加照片进fileList  !!待修正
  addToFileList() {
    const { fileList, cameraFileData, } = this.state;
    let dataList = [];
    for (let i of fileList) {
      dataList.push(i)
    }
    if (!!cameraFileData.originFileObj) {
      if (fileList.length < 3) {
        // 照片判重
        let isRepetitive = false;
        for (let i of fileList) {
          if (i.uid === cameraFileData.uid) isRepetitive = true;
        }
        if (!isRepetitive) {
          let fileData = cameraFileData;
          dataList.push(fileData);
          this.setState({
            fileList: dataList
          });
        } else {
          message.error('请勿重复保存照片')
        }
        this.closeCamera();
      } else {
        message.error('商品照片不能超过3张!')
      }
    } else {
      message.error('请先拍照!')
    }
  }
  // 自定义上传图片
  uploadFunction() {
    const { fileList, } = this.state;
    if ( fileList.length > 0 ) {
      let formData = new FormData(),fileListData = [];
      // 多文件格式
      for (let i in fileList) {
        formData.append(`file${parseInt(i)+1}`,fileList[i].originFileObj);
        // formData.append(`files[${i}]`,this.state.fileList[i].originFileObj);
        fileListData.push(fileList[i].originFileObj)
      }
      // 上传接口
      fetch(`${window.testUrl}/skuUpimg/headImgUpload`,{
        method: 'POST',
        body: formData,
      }).then(r=>r.json()).then(r=>{
        // 这里获取返回的imgUrl
        console.log(r)
        // 图片上传成功以后调取表单上传接口
      })
    } else {
      message.error('至少选择一张商品图片')
    }
  }
  // 上传前控制 - 禁用自动上传
  beforeUploadFunction(file,fileList) {
    // 可以获取到 file, fileList, 也可以在这里做文件校验处理
    // 禁用默认上传行为
    return false;
  }
  // 测试用function
  test() {
    console.log(this.state);
    console.log(this.props.form.getFieldsValue())
  }
  render() {
    const {getFieldDecorator} = this.props.form;
    const { fileList, cameraModalVisible, previewVisible, previewImage, hasCamera, titleName, currencyType, } = this.state;
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    return (
      <div className="commoditiesCreateAndEdit">
        <p className="titleName">商品{titleName}</p>

        {/*表单*/}
        <div className="formList">
          <Form>
            {/*商品条形码*/}
            <FormItem label="商品条形码"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 12}}
            >
              {getFieldDecorator('skuCode')(
                <Input style={{width: 180}}
                       placeholder="这里输入商品条形码"
                />
              )}
            </FormItem>

            {/*商品名称*/}
            <FormItem label="商品名称"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 12}}
            >
              {getFieldDecorator('name', {
                rules: [
                  {required: true, message: '请输入商品名称!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请输入商品名称"
                />
              )}
            </FormItem>

            {/*测试表单*/}
            <FormItem label="测试表单值"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 12}}
              // validator={this.brandNameValidator}
            >
              {getFieldDecorator('testValue', {
                // 表单验证
                rules: [
                  {required: true, message: '请输入测试表单值!'},
                  // {validator: this.brandNameValidator.bind(this)}
                ],
                // 默认值
                // initialValue:
              })(
                <Input style={{width: 180}}
                       placeholder="请输入测试表单值"
                />
              )}
            </FormItem>

            {/*上传图片/拍照模块*/}
            <FormItem colon
                      // label="商品照片(1-3张)"
                      label={<span className="ant-form-item-required">商品照片(1-3张)</span>}
                      labelCol={{span: 4}}
                      wrapperCol={{span: 20}}
                      style={{overflow:'hidden'}}
            >
                <Upload fileList={fileList}
                        supportServerRender
                        beforeUpload={this.beforeUploadFunction.bind(this)}
                        // 允许一次上传多个文件
                        multiple
                        // 预览类型
                        listType="picture-card"
                        // 接受上传的文件类型 允许(jpg,jpeg,png,gif)
                        accept="image/jpeg,image/png,image/gif"
                        onPreview={this.imagePreview.bind(this)}
                        onChange={this.imageChange.bind(this)}
                >
                  {fileList.length >= 3 ? null : uploadButton}
                </Upload>
              <Button type="primary"
                      disabled={fileList.length >= 3}
                      onClick={this.openCamera.bind(this)}
              >拍照上传</Button>
            </FormItem>

            {/*图片相关弹窗*/}
            <div>
              {/*摄像头拍照弹窗*/}
              <Modal width={1018}
                     title="使用摄像头拍照"
                     visible={cameraModalVisible}
                     onCancel={this.closeCamera.bind(this)}
                     centered
                     wrapClassName="modalWrap"
                     closable={false}
                     footer={
                       <div style={{textAlign:'center'}}>
                         {hasCamera && <Button type="primary"
                                               style={{marginRight:20}}
                                               onClick={this.addToFileList.bind(this)}
                         >确定</Button>}
                         <Button onClick={this.closeCamera.bind(this)}
                         >取消</Button>
                       </div>
                     }
              >
                <div className="cameraMain">
                  <video id="video"
                         width={480}
                         height={360}
                         // 禁音
                         muted
                         autoPlay="autoplay"
                  />
                  <canvas id="canvas"
                          width={480}
                          height={360}
                          style={{marginLeft: 10}}
                  />
                  <div className="takePhotoLine"
                       style={{textAlign: 'center', marginTop: '10px'}}
                  >
                    <Button type="primary"
                            style={{
                              backgroundColor: '#b917ff',
                              borderColor: '#b917ff'
                            }}
                            disabled={!hasCamera}
                            onClick={this.takePhoto.bind(this)}
                    >拍照</Button>
                  </div>
                </div>
              </Modal>
              {/*图片预览弹窗*/}
              <Modal visible={previewVisible}
                     footer={null}
                     onCancel={this.closePreview.bind(this)}
              >
                <img alt="example" style={{ width: '100%' }} src={previewImage} />
              </Modal>
            </div>

            {/*毛重*/}
            <FormItem label="毛重(kg)"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 12}}
            >
              {getFieldDecorator('grossWeight', {
                rules: [
                  {required: true, message: '请输入重量!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请输入重量"
                       type="number"
                />
              )}
            </FormItem>

            {/*成本价 / 采购价*/}
            <FormItem label="成本价/采购价"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('costPrice', {
                rules: [
                  {required: true, message: '请输入成本价/采购价!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请输入成本价/采购价"
                       type="number"
                />
              )}
              {/*选择货币类型*/}
              <Select className="currencyTypeSelect"
                      style={{width: 100,marginLeft: 10}}
                      // 当存在 defaultValue 时, 则无需 placeholder
                      defaultValue={0}
                      Value={currencyType}
                      onChange={(v) => this.setState({currencyType: v})}
              >
                <Option value={0}>人民币</Option>
                <Option value={1}>美元</Option>
                <Option value={2}>欧元</Option>
                <Option value={3}>日元</Option>
                <Option value={4}>韩币</Option>
                <Option value={5}>港币</Option>
              </Select>
            </FormItem>

            {/*选择商品品牌*/}
            <FormItem label="商品品牌"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('brand', {
                rules: [
                  {required: true, message: '请输入商品品牌!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请输入商品品牌"
                />
              )}
            </FormItem>

            {/*选择商品品类*/}
            <FormItem label="品类"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('category', {
                rules: [
                  {required: true, message: '请输入品类!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请输入品类"
                />
              )}
            </FormItem>

            {/*建议行邮方式*/}
            <FormItem label="建议行邮方式"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('category')(
                <Input style={{width: 180}}
                       placeholder="请输入建议行邮方式"
                />
              )}
            </FormItem>

            {/*提交按钮*/}
            <FormItem>
              <Button type="primary">提交</Button>
              <Button type="primary"
                      onClick={this.backTo.bind(this)}
                      style={{marginLeft: 20}}
              >返回上一个页面</Button>
              <Button type="primary"
                      onClick={this.uploadFunction.bind(this)}
                      style={{marginLeft: 20}}
              >
                测试图片上传
              </Button>
              <Button onClick={this.test.bind(this)}
                      style={{marginLeft: 20}}
              >test!</Button>
            </FormItem>

          </Form>
        </div>

      </div>
    );
  }
}

export default commoditiesCreateAndEdit;