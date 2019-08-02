import React from 'react';
import { Button, Upload, message, Icon, Modal, } from 'antd';

import './index.less';

class commoditiesImgList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 公共传参
      type: 'create',
      skuId: 'null',
      // 是否修改过图片文件
      isFileListChanged: false,
      // 图片文件
      fileList: [],
      // 摄像头弹窗
      cameraModalVisible: false,
      // 照片暂存数据
      cameraFileData: {},
      // 照片自增uid
      cameraUid: 0,
      // oss图片下载处理
      downloadFileList: [],
      // 图片预览
      previewVisible: false,
      previewImage: '',
      // 是否可以拍照和保存
      hasCamera: false,
      // 判断图片是否过大
      isFileTooLarge: false,
      // 修改过后的新商品图片列表
      newImgList: null,
      // Loading状态
      isLoading: false,
      // Loading提示文字
      loadingTxt: 'Loading...'
    };
    // window.commoditiesImgList = this;
  }
  componentDidMount() {
    const { type, skuId, record } = window.getAllQueryString();
    this.setState({
      type: type,
      skuId: skuId,
      record: record
    });

    if (type === 'edit') {
      // 如果类型为编辑, 则读取本地数据缓存, 将图片转入 upload 组件
      if (!!localStorage.imgList) {
        let imgList = JSON.parse(localStorage.imgList).imgList;
        const dataList = [];
        if (Array.isArray(imgList)) {
          for (let v of imgList) {
            dataList.push(`//${v.split('//')[1]}`)
          }
        } else {
          // d.imgList为空时, 值恒定为null, 这里不做处理, 直接赋值空数组
        }
        this.setState({ imgList: dataList },() => { this.makeImgToFile() });
      } else {
        this.ajax.post('/sku/selectEditSkuBySkuId',{skuId:skuId}).then(r => {
          if (r.data.status === 10000) {// 将图片地址保存在本地缓存
            const d = r.data;
            localStorage.imgList = JSON.stringify({imgList: d.imgList});
            const dataList = [];
            if (Array.isArray(d.imgList)) for (let v of d.imgList) dataList.push(`//${v.split('//')[1]}`);
            this.setState({ imgList: dataList },() => {
              this.makeImgToFile()
            });
          }
          r.showError();
        }).catch(r => {
          this.ajax.isReturnLogin(r,this);
        });
      }
    } else if (type === 'create') {
      // 如果类型为创建, 则将上传的图片所返回的图片地址, 保存在本地数据库, 传入创建商品页面
      if (!!localStorage.newImgList) {
        const imgList = JSON.parse(localStorage.newImgList).imgList;
        const dataList = [];
        if (Array.isArray(imgList)) for (let v of imgList) dataList.push(`//${v.split('//')[1]}`);
        this.setState({ imgList: dataList },() => { this.makeImgToFile() });
      }
    } else {
      message.error('错误的商品处理类型, 即将返回商品库页面!');
      this.props.history.push(`/commodities-manage/commodities-database?record=${record}`);
    }
  }
  // img图片转file
  makeImgToFile() {
    // 异步加载图片, img初始化设置, 这里放开头部验证, 防止canvas转码出现跨域问题
    // ***重要*** 需要图片所在的服务端已经做好跨域配置
    let theImg = new Image();
    theImg.crossOrigin = "*";
    // canvas初始化设置
    let dlImgCanvas = document.createElement("canvas");
    let dIC = dlImgCanvas.getContext('2d');
    // 初始化图片列表长度
    let imgList;
    imgList = this.state.imgList;
    if (imgList.length > 0) {
      let iL = imgList.length, i = 0;
      // 初次赋予 img 图片地址链接
      theImg.src = `//${imgList[i].split('//')[1]}`;
      // 显示 loading
      this.setState({isLoading: true, loadingTxt: '图片加载中...'});
      // 利用onload是在图片加载完成以后触发的机制, 制作异步循环
      theImg.onload = (e) => {
        // 指向该img标签
        // console.log(e.path[0]);
        if (i < iL) {
          // 这里撑开 canvas 标签的宽高, 以适应下载的 img 图像大小
          dlImgCanvas.width = theImg.width;
          dlImgCanvas.height = theImg.height;
          // 这里将 img 绘制到 canvas 上, 并利用 canvas 生成 base64 码, 然后转化为 file 格式
          dIC.drawImage(theImg, 0, 0);
          let src = e.path[0].src.split('.'),srcType;
          if (src[src.length-1] === 'jpg' || src[src.length-1] === 'jpeg') {
            srcType = 'image/jpeg'
          } else if (src[src.length-1] === 'png') {
            srcType = 'image/png'
          }
          let file = this.dataURLtoFile(dlImgCanvas.toDataURL(srcType),`图片.${src[src.length-1]}`);
          let dataList = [];
          for (let v of this.state.fileList) {
            dataList.push(v)
          }
          let uploadFile = {
            thumbUrl: dlImgCanvas.toDataURL(srcType),
            uid: `upload-download-${i}`,
            originFileObj: file,
            lastModified: file.lastModified,
            lastModifiedDate: file.lastModifiedDate,
            name: file.name,
            percent: file.percent,
            size: file.size,
            type: file.type,
          };
          dataList.push(uploadFile);
          i = i + 1;
          // 赋值, 并关闭 loading
          this.setState({fileList: dataList,isLoading: false, loadingTxt: 'Loading...'});
          // 这里防止在最后一次赋值以后, 多做一次对 img 的 src 的操作
          if (i < iL) {
            // 对 imgList 判空防止代码报错
            theImg.src = `//${ imgList[i] ? imgList[i].split('//')[1] : '' }`;
            // 显示 loading
            this.setState({isLoading: true, loadingTxt: '图片加载中...'});
          }
        }
      };
      theImg.onerror = (e) => {
        // 指向该img标签
        // console.log(e.path[0]);
        message.error('图片加载出错')
      }
    }
  }
  // 查看图片
  imagePreview(f) {
    this.setState({
      previewImage: f.url || f.thumbUrl,
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
  imageChange(f) {
    // 这里用于恢复 isFileTooLarge 状态
    this.state.isFileTooLarge = false;
    let dataList = [];
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
            this.setState({ fileList: dataList, isFileListChanged: true });
          } else {
            dataList = f.fileList;
            this.setState({ fileList: dataList, isFileListChanged: true });
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
      // 虽然不是官方做法, 但是可以成功只在渲染结束以后调取一次"文件超出10m"的提示
      this.setState({isFileTooLarge: true},()=>{
        message.error('单个文件大小不能超过10m')
      });
      // 当上传单个文件超过10m或文件列表中有任意文件大于10m时, 列表不予更新, 并且在渲染完成以后进行warn提示
    }
  }
  // 打开摄像头弹窗
  openCamera() {
    this.setState({
      cameraModalVisible: true
    },()=>{
      this.getMedia()
    })
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
    if (navigator.mediaDevices === undefined) {
      message.warn('暂时无法使用摄像头');
      return false;
    }
    // 获取摄像头内容,显示在video中
    const promise = navigator.mediaDevices.getUserMedia({
      video: {width: 480, height: 480}, audio: true
    }), the = this;
    promise.then(MediaStream => {
      const video = document.getElementById("video");
      video.srcObject = MediaStream;
      video.play();
      the.setState({hasCamera: true});
    }).catch(error => {
      message.error('调取摄像头失败, 请确保电脑已经成功链接摄像头, 并通过浏览器调用摄像头的申请!');
      console.log(error.name);
      console.log(error.message);
      the.setState({hasCamera: false});
    })
  }
  // 拍照
  takePhoto() {
    //获得Canvas对象
    let video = document.getElementById("video");
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 480, 480);
    let file = this.dataURLtoFile(canvas.toDataURL("image/jpeg"),'照片.jpg');
    // 将数据保存为 antd 的 upload 所支持的格式
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
  // 添加照片进fileList
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
            fileList: dataList,
            isFileListChanged: true
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
  uploadFunction(type,skuId) {
    // 打开loading
    this.setState({
      isLoading: true,
      loadingTxt: '图片上传中, 请稍后...'
    });
    const { fileList, record } = this.state;
    if ( fileList.length > 0 ) {
      let formData = new FormData(),fileListData = [];
      // 多文件格式
      for (let i in fileList) {
        formData.append(`file${parseInt(i)+1}`,fileList[i].originFileObj);
        fileListData.push(fileList[i].originFileObj)
      }
      // 上传接口
      this.ajax.post('/skuUpimg/skuImgUpload',formData,{},true).then(r => {
        // 关闭loading
        this.setState({
          isLoading: false,
          loadingTxt: 'Loading...'
        });
        if (r.data.status === 10000) {
          // 图片上传成功以后根据类型判断下一步行为
          if (type === 'create') {
            // localStorage 只能存储字符串, 但是可以自动将数组转化为由 ',' 分割的 string
            message.success('图片上传成功, 请继续填写信息以完成商品录入');
            localStorage.newImgList = JSON.stringify({imgList: r.data.data});
            this.props.history.push(`/commodities-manage/commodities-database/create-and-edit?type=${type}&skuId=${skuId}&record=${record}`);
          } else if (type === 'edit') {
            this.editSkuImg(type,skuId,r.data.data);
          }
        }
        r.showError();
      }).catch(r => {
        this.ajax.isReturnLogin(r,this)
      });
    } else {
      // 关闭loading
      this.setState({ isLoading: false, loadingTxt: 'Loading...' });
      if (type === 'create') {
        localStorage.newImgList = JSON.stringify({imgList:[]});
      } else if (type === 'edit') {
        this.editSkuImg(type,skuId,{imgList:[]});
      }
      this.props.history.push(`/commodities-manage/commodities-database/create-and-edit?type=${type}&skuId=${skuId}&record=${record}`);
    }
  }
  // 修改sku图片地址
  editSkuImg(type,skuId,newImgList) {
    const { record, } = this.state;
    const data = {
      skuId: skuId,
      newImgList: newImgList
    };
    this.ajax.post('/sku/editSkuImg',data).then(r => {
      if (r.data.status === 10000) {
        // 修改成功
        message.success(`${r.msg}`);
        // 返回上一页面
        this.props.history.push(`/commodities-manage/commodities-database/create-and-edit?type=${type}&skuId=${skuId}&record=${record}`);
      }
      r.showError();
    }).catch(r => {
      this.ajax.isReturnLogin(r,this)
    });
  }
  // 保存按钮
  submit() {
    // 判断类型, 保存以后跳转回上一个页面
    const { type, skuId, } = this.state;
    this.uploadFunction(type,skuId)
  }
  // 返回上一个界面
  backTo() {
    const { type, skuId, record } = this.state;
    this.props.history.push(`/commodities-manage/commodities-database/create-and-edit?type=${type}&skuId=${skuId}&record=${record}`);
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { fileList, cameraModalVisible, previewVisible, previewImage, hasCamera, isLoading, loadingTxt, } = this.state;
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">添加图片</div>
      </div>
    );
    return (
      <div className="commoditiesImgList contentMain">
        <div className="title">
          <div className="titleMain">图片修改</div>
          <div className="titleLine" />
        </div>

        {/*loading遮罩层*/}
        {isLoading && <div className="loading">
          <div className="loadingMain">
            <Icon type="loading" /> {loadingTxt}
          </div>
        </div>}

        {/*上传图片/拍照模块*/}
        <div style={{overflow:'hidden'}}
             className="imgEdit"
        >
          <Upload fileList={fileList}
                     supportServerRender
                     beforeUpload={() => {return false}}
                     // 允许一次上传多个文件
                     multiple
                     // 预览类型
                     listType="picture-card"
                     // 接受上传的文件类型 允许(jpg,jpeg,png,gif)
                     // "image/jpeg,image/png,image/gif"
                     accept="image/jpeg,image/png"
                     onPreview={this.imagePreview.bind(this)}
                     onChange={this.imageChange.bind(this)}
        >
          {fileList.length >= 3 ? null : uploadButton}
        </Upload>
          <Button type="primary"
                  disabled={fileList.length >= 3 || !navigator.mediaDevices}
                  onClick={this.openCamera.bind(this)}
                  style={{marginTop: 35}}
          >拍照上传</Button>
        </div>


        {/*图片相关弹窗*/}
        {/*由于弹窗组件 Modal 生成于 body 中的新 div 中, 故无需设置 className 去进行定位*/}
        <div>
          {/*摄像头拍照弹窗*/}
          <Modal width={1018}
                 className="commoditiesCreateAndEditModal"
                 title="使用摄像头拍照"
                 visible={cameraModalVisible}
                 onCancel={this.closeCamera.bind(this)}
                 // centered
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
                     height={480}
                     // 禁音
                     muted
                     autoPlay="autoplay"
              />
              <canvas id="canvas"
                      width={480}
                      height={480}
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

        <div className="btnLine">
          <Button type="primary"
                  onClick={this.submit.bind(this)}
          >保存</Button>
          <Button type="primary"
                  onClick={this.backTo.bind(this)}
                  style={{marginLeft: 10}}
          >返回</Button>
        </div>

      </div>
    )
  }
}

export default commoditiesImgList;