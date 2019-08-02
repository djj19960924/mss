import React from 'react';
import {Radio, Table, Button, Modal, message, Pagination, Icon,} from 'antd';
import moment from 'moment';
import JsZip from 'jszip';
import { inject, observer } from 'mobx-react';

import './index.less';

@inject('appStore') @observer
class countBillList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 压缩组件, 初始化
      zip: new JsZip(),
      // 护照文件夹
      passportFolder: null,
      // 小票文件夹
      ticketFolder: null,
      // 下载图片弹窗
      downloadModalVisible: false,
      // 小票下载成功列表
      ticketSuccessList: [],
      // 小票下载成功id列表
      ticketSuccessIdList: [],
      // 小票下载失败列表
      ticketErrorList: [],
      // 护照下载成功列表
      passportSuccessList: [],
      // 护照下载失败列表
      passportErrorList: [],
      // 确认键加载状态
      isOkLoading: false,
      // 加载文本列表
      loadingTextList: [
        '正在下载图片,请稍后...',
        '正在发送小票,请稍后...'
      ],
      // 弹窗提示类型
      textType: 0,
      // 弹窗提示列表
      textInfoList: [
        "点击确认按钮, 下载并压缩所选小票图片以及护照图片",
        "如需继续操作, 请关闭窗口, 重新选择小票",
      ],
      // 是否可以关闭弹窗
      closeIsAllowed: true,

      // 选择条件
      verifyStatus: 0,
      // 表格数据
      tableDataList: [],
      // 选中条目
      selectedList: [],
      // 选中条目ID
      selectedIds: [],

      // 分页
      pageTotal: 0,
      pageNum: 1,
      pageSize: 200,
      pageSizeOptions: [`100`, `200`, `300`, `500`],

      // 图片弹窗
      previewVisible: false,
      previewImage: '',
      btnIsLoading: false,
      tableIsLoading: false,
    };
  }

  allow = this.props.appStore.getAllow.bind(this);

  // 默认读取表格
  componentDidMount() {
    const { zip } = this.state;
    // 载入zip组件
    this.setState({passportFolder: zip.folder("护照"),ticketFolder: zip.folder("小票")});
    // 默认载入表格数据
    this.getReciptByVerify();
  }

  // 改变发送状态
  changeVerifyStatus(e) {
    this.setState({
      verifyStatus: e.target.value
    },()=>{
      this.getReciptByVerify()
    });
  }

  // 根据发送状态获取对账表
  getReciptByVerify() {
    const {verifyStatus, pageNum, pageSize} = this.state;
    this.setState({tableIsLoading: true});
    let data = {verifyStatus: verifyStatus, pageNum: pageNum, pageSize};
    this.ajax.post('/recipt/getReciptByVerify',data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        for (let i in data.list) data.list[i].id = (parseInt(i) + 1);
        this.setState({
          tableDataList: data.list,
          pageTotal: data.total,
          pageSizeOptions: [`100`, `200`, `300`, `${data.total > 500 ? data.total : 500}`],
          selectedList: [],
          selectedIds: [],
        })
      }
      this.setState({tableIsLoading: false});
      r.showError();
    }).catch(r => {
      this.setState({tableIsLoading: false});
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 打开图片预览弹窗
  openPreview(url) {
    // console.log(url)
    this.setState({
      previewVisible: true,
      previewImage: url
    })
  }

  // 关闭图片预览弹窗
  closePreview() {
    this.setState({
      previewVisible: false,
      previewImage: ''
    })
  }

  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize,
    }, () => {
      this.getReciptByVerify()
    })
  }

  // 发送所选小票接口
  sendReciptInSelected() {
    const {ticketSuccessIdList, ticketSuccessList} = this.state;
    let data = {};
    data.list = [];
    data.reciptIdList = ticketSuccessIdList;
    for (let v of ticketSuccessList) {
      data.list.push({
        passport: v.passport,
        passportNum: v.passportNum,
        pictureUrl: v.pictureUrl,
      });
    }
    if (data.list.length > 0 && data.reciptIdList.length > 0) {
      this.ajax.post('/recipt/sendReciptInSelected', data).then(r => {
        if (r.data.status === 10000) {
          message.success(r.data.data);
          this.setState({textType: 2});
          this.getReciptByVerify();
        }
        this.setState({isOkLoading: false, closeIsAllowed: true});
        r.showError();
      }).catch(r => {
        this.setState({isOkLoading: false, closeIsAllowed: true});
        this.ajax.isReturnLogin(r, this);
      });
    } else {
      message.error('小票下载成功列表为空')
    }
  }

  // 弹窗确定按钮方法
  clickOkBtn() {
    const { textType, } = this.state;
    if (textType === 0) {
      this.setState({isOkLoading: true,closeIsAllowed: false},()=>{
        this.downloadAndZipFiles();
      });
    } else {
      message.warn(`小票已成功发送, 请关闭窗口重新选择新的小票`);
    }
  }

  // 下载并压缩图片文件
  downloadAndZipFiles() {
    const { selectedList, ticketFolder, passportFolder, zip, passportSuccessList, ticketSuccessList, ticketSuccessIdList, ticketErrorList, passportErrorList, } = this.state;
    let Num = 0;
    let addNum = () => {
      Num += 1;
      downloadPic();
      this.setState({});
    };
    let downloadPic = () => {
      if (Num < selectedList.length) {
        // 获取地址
        let dataObj = selectedList[Num];

        // 处理护照链接以及护照图片类型
        let passport = `//${dataObj.passport.split('//')[1]}`,
          passportTypeList = dataObj.passport.split('.'),
          passportType = passportTypeList[(passportTypeList.length - 1)];

        // 处理小票链接以及小票图片类型
        let pictureUrl = `//${dataObj.pictureUrl.split('//')[1]}`,
          pictureTypeList = dataObj.pictureUrl.split('.'),
          pictureType = pictureTypeList[(pictureTypeList.length - 1)];

        // 处理护照下载压缩, 逻辑判断是否进行
        let downloadPassport = () => {
          if (passportSuccessList.includes(passport)) {
            addNum();
          } else {
            fetch(passport).then(r => r.blob()).then(r => {
              // 成功调取接口, 创建小票文件
              passportFolder.file(`护照号_${dataObj.passportNum}.${passportType}`, r);
              passportSuccessList.push(passport);
              addNum();
            }).catch(() => {
              // 前端报错
              message.error(`前端错误: 获取护照图片失败`);
              passportErrorList.push(dataObj.passportNum);
              addNum();
            });
          }
        };

        // 处理小票下载压缩
        fetch(pictureUrl).then(r => r.blob()).then(r => {
          // 成功调取接口, 创建小票文件
          ticketFolder.file(`护照号_${dataObj.passportNum} - 小票id_${dataObj.reciptId}.${pictureType}`, r);
          ticketSuccessList.push(dataObj);
          ticketSuccessIdList.push(dataObj.reciptId);
          downloadPassport();
        }).catch(()=>{
          // 前端报错
          message.error(`前端错误: 获取id为${dataObj.reciptId}小票图片失败`);
          ticketErrorList.push(dataObj);
          downloadPassport();
        });

      } else {
        // 下载所有图片完成, 导出zip文件
        let fileName = `对账管理${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.zip`;
        zip.generateAsync({type: "blob"}).then((file) => {
          window.saveAs(file, fileName);
          this.setState({textType: 1},()=>{
            this.sendReciptInSelected();
          });
        }).catch(r=>{
          message.error(`前端错误: 下载/压缩失败`);
          this.setState({isOkLoading: false,textType: 0});
        });
      }
    };
    downloadPic();
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const RadioButton = Radio.Button, RadioGroup = Radio.Group;
    // 表单头
    const columns = [
      {title: `小票ID`, dataIndex: `reciptId`, key: 'reciptId', width: 50},
      {title: '小票照片', dataIndex: 'pictureUrl', key: 'pictureUrl', width: 140,
        render: (text, record) => (
          <Button onClick={this.openPreview.bind(this, record.pictureUrl)}
          >点击查看</Button>
        )},
      {title: '护照号码', dataIndex: 'passportNum', key: 'passportNum', width: 140},
      {title: '护照首页照片', dataIndex: 'passport', key: 'passport', width: 140,
        render: (text, record) => (
          <Button onClick={this.openPreview.bind(this, record.passport)}
          >点击查看</Button>
        )},
    ];
    const columnsAdd = {title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 140,};
    const {tableDataList, verifyStatus, previewVisible, previewImage, selectedList, selectedIds, pageTotal, pageSize, pageNum, pageSizeOptions, tableIsLoading, downloadModalVisible, isOkLoading, textInfoList, textType, ticketSuccessList, passportSuccessList, closeIsAllowed, loadingTextList, ticketErrorList, passportErrorList, } = this.state;
    return (
      <div className="countBillList contentMain">
        <div className="title">
          <div className="titleMain">对账管理</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          {/*查询条件单选行*/}
          <RadioGroup buttonStyle="solid"
                      className="radioBtn"
                      value={verifyStatus}
                      onChange={this.changeVerifyStatus.bind(this)}
          >
            <RadioButton value={0}>未发送</RadioButton>
            <RadioButton value={1}>已发送</RadioButton>
          </RadioGroup>

          <span style={{marginLeft: 10}}>共计: {pageTotal} 条</span>
        </div>

        {/*执行行*/}
        <div className="btnLine" style={{marginLeft: 10}}>
          {this.allow(76) && verifyStatus === 0 &&
            <Button type="primary"
                    onClick={()=>{this.setState({ downloadModalVisible: true, textType: 0})}}
                    disabled={selectedList.length === 0}
            >下载所选小票图片</Button>
          }
        </div>

        {/*下载图片*/}
        <Modal title="下载并发送所选图片"
               wrapClassName="downloadAndZipFilesModal"
               visible={downloadModalVisible}
               onOk={this.clickOkBtn.bind(this)}
               confirmLoading={isOkLoading}
               onCancel={() => {
                 closeIsAllowed ? this.setState({
                         downloadModalVisible: false,
                         ticketSuccessList: [],
                         ticketSuccessIdList: [],
                         ticketErrorList: [],
                         passportSuccessList: [],
                         passportErrorList: []
                      })
                   : message.warn(`图片下载中, 请勿关闭`)
               }}
        >
          {/*确定按钮提示*/}
          <p style={{color:'rgba(255,0,0,.7)'}}>{textInfoList[textType]}</p>
          {/*加载状态显示*/}
          {isOkLoading &&
            <div style={{fontSize:'24px',color:'rgba(255,0,0,.7)'}}>
              <Icon type="loading" style={{paddingRight:'10px'}}/>
              {loadingTextList[textType]}
            </div>
          }
          {/*图片下载成功条数提示*/}
          {(textType !== 2) &&
            <div>
              <p>当前小票成功下载条数: {ticketSuccessList.length}/{selectedIds.length}</p>
              <p>当前护照成功下载条数: {passportSuccessList.length}</p>
            </div>
          }
          {/*报错提示*/}
          <p>小票下载错误信息: {ticketErrorList.length === 0 ? '无'
            : ticketErrorList.map(item =>
              <span style={{color:'rgba(255,0,0,.7)'}}>下载出错小票ID: {item.reciptId}</span>)}
          </p>
          <p>护照下载错误信息: {passportErrorList.length === 0 ? '无'
              : passportErrorList.map(item =>
              <span style={{color:'rgba(255,0,0,.7)'}}>下载出错护照号: {item}</span>)}
          </p>
        </Modal>

        {/*图片预览弹窗*/}
        <Modal visible={previewVisible}
               width={800}
               footer={null}
               onCancel={this.closePreview.bind(this)}
        >
          <img alt="example" style={{width: '100%'}} src={previewImage}/>
        </Modal>

        <div className="tableMain">
          {/*表单主体*/}
          <Table className="tableList"
                 dataSource={tableDataList}
                 columns={verifyStatus === 0 ? columns : columns.concat(columnsAdd)}
                 pagination={false}
                 loading={tableIsLoading}
                 bordered
                 rowSelection={verifyStatus === 0 ? {
                   selectedRowKeys: selectedIds,
                   // 选择框变化时触发
                   onChange: (selectedRowKeys, selectedRows) => {
                     this.setState({selectedList: selectedRows, selectedIds: selectedRowKeys});
                   },
                 } : null}
                 scroll={{y: 500, x: 800}}
                 rowKey={(record, index) => `${record.reciptId}`}
          />

          {/*分页*/}
          <Pagination className="tablePagination"
                      total={pageTotal}
                      pageSize={pageSize}
                      current={pageNum}
                      showTotal={(total, range) =>
                        `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 `}共 ${total} 条记录`
                      }
                      onChange={this.changePage.bind(this)}
                      showSizeChanger
                      pageSizeOptions={pageSizeOptions}
                      onShowSizeChange={this.changePage.bind(this)}
          />
        </div>
      </div>
    )
  }
}

export default countBillList;