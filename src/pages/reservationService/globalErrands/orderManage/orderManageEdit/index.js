import React from "react";
import {Button, Col, Icon, Input, InputNumber, Modal, Row, Table, message} from 'antd';
import moment from 'moment';
import './index.less';

class orderManageEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imgList: [],
      legworkProductVos: [],
      currentInfo: {
        id: null,
        legworkId: null,
        imgUrl: null,
        productNum: 1,
        productName: ''
      },
      imgDomList: [],
      addEditModalShow: false,
      addEditModalDetail: {
        title: '',
        icon: '',
      },
      tableIsLoading: false,
      okIsLoading: false
    }
  }

  componentDidMount() {
    const legworkId = Number(window.getQueryString('legworkId'));
    this.setState({legworkId}, () => {
      this.findLegworkById()
    });
  }

  // 返回订单管理页面
  backToOrderManage() {
    const {push} = this.props.history;
    push(`/reservation-service/global-errands/order-manage/`);
  }

  // 通过id查询商品详情
  findLegworkById() {
    const {legworkId} = this.state;
    const showLoading = Is => this.setState({tableIsLoading: Is});
    showLoading(true);
    const data = {legworkId};
    this.ajax.post('/legwork/findLegworkById', data).then(r => {
      const {data, status} = r.data;
      const dataObj = {};
      if (status === 10000) {
        Object.assign(dataObj, data)
      } else {
        this.backToOrderManage();
      }
      this.setState(dataObj);
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 创建图片选择框
  buildImg(url, index) {
    return <img src={url} alt=""
                className="imgStyle"
                key={index}
                onClick={this.imgDetail.bind(this, url)}
    />
  }

  // 图片详情
  imgDetail(url) {
    Modal.info({
      title: '查看商品图片',
      icon: 'picture',
      className: 'imgDetail',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      width: 500,
      content: (
        <div>
          <img alt={null}
               style={{width:'100%'}}
               src={url} />
        </div>
      )
    });
  }

  // 新增/修改弹窗打开
  addOrEdit(type, record) {
    const {imgList} = this.state;
    const dataObj = {
      addEditModalShow: true,
      addEditModalDetail: {}
    };
    if (type === 'add') {
      dataObj.addEditModalDetail.title = '新增商品';
      dataObj.addEditModalDetail.icon = 'plus-circle';
    } else if (type === 'edit') {
      dataObj.addEditModalDetail.title = '编辑商品';
      dataObj.addEditModalDetail.icon = 'form';
      dataObj.currentInfo = {
        id: record.productId,
        imgUrl: record.imgUrl,
        productNum: record.productNum,
        productName: record.productName
      }
    }
    this.setState(dataObj,()=>{
      if (this.state.currentInfo.imgUrl) {
        for (let i in imgList) {
          if(imgList[i] === this.state.currentInfo.imgUrl) {
            this.clearBorder()
            const imgDom = document.querySelector(`.img_${i}`);
            document.querySelector('.orderManageEditModal .imgMain').scrollLeft = (imgDom.offsetLeft - 24);
            imgDom.style.border= '2px solid rgba(255,50,50,1)';
          }
        }
      } else {
        document.querySelector('.orderManageEditModal .imgMain').scrollLeft = 0;
        this.clearBorder()
      }
    });
  }

  // 去除图片边框样式
  clearBorder() {
    const ImgRadios = document.querySelectorAll('.imgRadio');
    for (let i in ImgRadios) {
      if (ImgRadios[i].style) ImgRadios[i].style.border= ''
    }
  }

  // 创建图片单选框
  buildImgButton(url, index) {
    return (
      <img src={url} alt=""
           className={`imgStyle img_${index} imgRadio`}
           key={index}
           onClick={() => {
             this.clearBorder();
             if (this.state.currentInfo.imgUrl !== url) {
               document.querySelector(`.img_${index}`).style.border = '2px solid rgba(255,50,50,1)';
               this.state.currentInfo.imgUrl = url;
               this.setState({});
             } else {
               this.state.currentInfo.imgUrl = null;
               this.setState({});
             }
           }}
      />
    )
  }

  // 删除
  delete(record) {
    const data = {
      id: record.productId
    };
    Modal.confirm({
      title: '删除商品',
      content: '确认删除该角色',
      okText: '删除',
      okType: 'danger',
      maskClosable: true,
      onOk: () => {
        this.ajax.post('/legworkBuyer/deleteLegworkProduct', data).then(r => {
          const {status, msg} = r.data;
          if (status === 10000) {
            message.success(msg);
            this.findLegworkById();
          }
          r.showError();
        }).catch(r => {
          console.error(r);
          this.ajax.isReturnLogin(r, this);
        })
      }
    })
  }

  // 新增/编辑商品详情
  changeLegworkProduct() {
    const {currentInfo, addEditModalDetail, legworkId} = this.state;
    const showLoading = Is => this.setState({okIsLoading: Is});
    showLoading(true);
    const data = currentInfo;
    let path = '';
    if (addEditModalDetail.title === '新增商品') {
      path = '/legworkBuyer/insertLegworkImg';
      data.legworkId = legworkId;
    }
    if (addEditModalDetail.title === '编辑商品') {
      path = '/legworkBuyer/updateLegworkProduct';
    }
    this.ajax.post(path, data).then(r => {
      const {status, msg} = r.data;
      if (status === 10000) {
        message.success(msg);
        this.closeModal();
        this.findLegworkById();
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 关闭弹窗
  closeModal() {
    this.setState({
      addEditModalShow: false,
      currentInfo: {
        imgUrl: null,
        productNum: 1,
        productName: ''
      }
    })
  }

  // 完成商品编辑弹窗
  finishEdit() {
    const {legworkId} = this.state;
    // 该接口权限较深, 注意处理
    const updateLegworkIsEnd = () => {
      const data = {id: legworkId, isEnd: -1};
      this.ajax.post('/legwork/updateLegworkIsEnd', data).then(r => {
        const {msg, status} = r.data;
        if (status === 10000) {
          message.success(msg);
          this.props.history.push('/reservation-service/global-errands/order-manage');
        }
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r, this);
      });
    };
    Modal.confirm({
      title: '完成编辑',
      content: '是否确认已完成商品明细编辑?',
      onOk: updateLegworkIsEnd,
    })
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }

  render() {
    const columns = [
      {title: '商品名', dataIndex: 'productName', key: 'productName'},
      {title: '商品数量', dataIndex: 'productNum', key: 'productNum', width: 80},
      {title: '商品图片', dataIndex: 'imgUrl', key: 'imgUrl', width: 110,
        render: url => (
          <div>{
            url ?
              <img src={url} alt=""
                   className="imgDetail"
                   onClick={this.imgDetail.bind(this, url)}
              />
              : '无'
          }</div>
        )
      },
      {title: '操作', dataIndex: '操作', key: '操作', width: 160,
        render: (text, record) =>
          <div>
            <Button type="primary"
                    onClick={this.addOrEdit.bind(this, 'edit', record)}
            >编辑</Button>
            <Button type="danger"
                    style={{marginLeft: 10}}
                    onClick={this.delete.bind(this, record)}
            >删除</Button>
          </div>
      },
    ];
    const {createTime, updateTime, nickname, wechatNo, followUper, productDetail, imgList, legworkProductVos, tableIsLoading, addEditModalShow, addEditModalDetail, currentInfo, okIsLoading} = this.state;
    return (
      <div className="orderManageEdit contentMain">
        <div className="title">
          <div className="titleMain">编辑订单商品详情</div>
          <div className="titleLine" />
        </div>

        <Modal visible={addEditModalShow}
               title={addEditModalDetail.title}
               icon={addEditModalDetail.icon}
               wrapClassName="orderManageEditModal"
               onOk={this.changeLegworkProduct.bind(this)}
               confirmLoading={okIsLoading}
               onCancel={this.closeModal.bind(this)}
               forceRender
        >
          <Row>
            <Col span={4}
            >商品名:</Col>
            <Col span={20}>
              <Input placeholder="请输入商品名"
                     value={currentInfo.productName}
                     onChange={e => {
                       currentInfo.productName = e.target.value;
                       this.setState({})
                     }}
                     style={{width: 300}}
              />
            </Col>
          </Row>
          <Row>
            <Col span={4}
            >数量:</Col>
            <Col span={20}>
              <InputNumber min={1}
                           precision={0}
                           onChange={Num => {
                             currentInfo.productNum = Num;
                             this.setState({})
                           }}
                           value={currentInfo.productNum}
              />
            </Col>
          </Row>
          <Row>
            <Col span={6}
            >图片选择:</Col>
          </Row>
          {/*图片选择*/}
          <div className="imgMain">
            <div className="imgBody">
              {imgList.map(this.buildImgButton.bind(this))}
            </div>
          </div>
        </Modal>

        <div className="explanation">
          <div className="orderDetail">
            <Row>
              {/*订单信息*/}
              <Col span={12}>
                {/*主要信息区域*/}
                <div className="infoMain">
                  {/*预定时间*/}
                  <div className="label">预定时间:</div>
                  <div className="content">
                    {createTime ? moment(createTime).format(`YYYY-MM-DD HH:mm:ss`) : '无'}
                  </div>
                  {/*更新时间*/}
                  <div className="label">更新时间:</div>
                  <div className="content">
                    {updateTime ? moment(updateTime).format(`YYYY-MM-DD HH:mm:ss`) : '无'}
                  </div>
                  {/*微信昵称*/}
                  <div className="label">微信昵称:</div>
                  <div className="content"
                       title={nickname}
                  >{nickname ? nickname : '无'}
                  </div>
                  {/*微信号*/}
                  <div className="label">微信号:</div>
                  <div className="content"
                       title={wechatNo}
                  >{wechatNo ? wechatNo : '无'}
                  </div>
                  {/*跟进人*/}
                  <div className="label">跟进人:</div>
                  <div className="content"
                       title={followUper}
                  >{followUper ? followUper : '无'}
                  </div>
                </div>
                {/*主要图片区域*/}
                <div className="imgMain">
                  <div className="imgBody">
                    {/*图片*/}
                    {imgList.map(this.buildImg.bind(this))}
                  </div>
                </div>
              </Col>
              {/*订单详情*/}
              <Col span={12}>
                {/*商品详细信息*/}
                <div className="detailTitle">商品详细信息:</div>
                <div className="overflow">
                  <div className="detailsMain">
                    {productDetail ? productDetail : '无'}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        <div className="tableMain"
             style={{maxWidth: 850}}
        >
          {/*表单主体*/}
          <Table className="tableList"
                 id="tableList"
                 dataSource={legworkProductVos}
                 columns={columns}
                 pagination={false}
                 loading={tableIsLoading}
                 bordered
                 scroll={{ y: 300, x: 750 }}
                 rowKey={(record, index) => `id_${index}`}
          />

          <div className="btnLine">
            <Button type="default"
                    onClick={this.addOrEdit.bind(this, 'add')}
            ><Icon type="plus" />新增商品明细</Button>
          </div>

          <div className="btnLine">
            <Button type="primary"
                    onClick={this.finishEdit.bind(this)}
            >完成商品编辑</Button>
            <Button type="danger"
                    onClick={()=>{
                      this.props.history.push('/reservation-service/global-errands/order-manage')
                    }}
                    style={{marginLeft: 10}}
            >返回订单管理</Button>
          </div>
        </div>

      </div>
    )
  }
}

export default orderManageEdit;