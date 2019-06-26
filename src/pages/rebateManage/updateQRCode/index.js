import React from 'react';
import { message, Button, Upload, Icon, Modal, } from 'antd';
import {inject, observer} from 'mobx-react/index';
import './index.less';

@inject('appStore') @observer
class updateQRCode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imgUrl: ``,
      uploadLoading: false,
      // 图片文件
      fileList: [],
      // 图片预览
      previewVisible: false,
      previewImage: '',
    };
  }
  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    this.getQrCode()
  }

  // 获取当前日上二维码图片
  getQrCode() {
    this.ajax.post('/rebate/getQrCode').then(r => {
      if (r.data.status === 10000) this.setState({imgUrl: r.data.data});
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 上传图片
  uploadFunction() {
    const { fileList, } = this.state;
    if (fileList.length > 0) {
      this.setState({uploadLoading: true});
      let formData = new FormData();
      formData.append(`file`,fileList[0].originFileObj);
      // 上传接口
      this.ajax.post('/upimg/mallImgUpload', formData, {}, true).then(r => {
        if (r.data.status === 10000) {
          message.success(r.data.msg);
          this.setState({fileList: [], uploadLoading: false});
          this.getQrCode();
        }
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    } else if (fileList.length === 0) {
      message.error(`请选择图片文件`)
    } else{
      message.error(`前端错误: 文件数据错误`)
    }
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { imgUrl, previewVisible, previewImage, fileList, uploadLoading, } = this.state;
    const uploadButton = <div><Icon type="plus" /><div className="ant-upload-text">添加图片</div></div>;
    return (
      <div className="updateQRCode">
        <div className="title">
          <div className="titleMain">上传日上二维码图片</div>
          <div className="titleLine" />
        </div>
        <div>
          {imgUrl ? <img className="QRCodeImg"
                          src={imgUrl}
                          alt=""
          /> : <div className="loadingImg"><Icon type="loading" /> 加载图片中...</div>}
        </div>

        <div className="imgEdit">
          <Upload fileList={fileList}
                  supportServerRender
                  beforeUpload={() => {return false}}
                  // 预览类型
                  listType="picture-card"
                  accept="image/jpeg,image/png"
                  onPreview={(f) => {
                    this.setState({previewImage: f.url || f.thumbUrl, previewVisible: true})
                  }}
                  onChange={(f) => { this.setState({fileList:f.fileList})} }
          >{fileList.length > 0 ? null : uploadButton}
          </Upload>
        </div>

        <div className="btnLine">
          <Button type="primary"
                  onClick={this.allow(73) ? this.uploadFunction.bind(this) : null}
                  loading={uploadLoading}
                  disabled={!this.allow(73)}
                  title={!this.allow(73) ? '没有该操作权限' : null}
          >上传图片</Button>
        </div>

        {/*图片预览弹窗*/}
        <Modal visible={previewVisible}
               footer={null}
               onCancel={() => this.setState({previewVisible: false})}
        >
          <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </div>
    )
  }
}

export default updateQRCode;