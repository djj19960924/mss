import React from 'react';
import {Button, DatePicker, Modal, Pagination, Radio, Table,} from 'antd';
import moment from 'moment';

import './index.less';

class airportTransfer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      infoType: 0,
      pageTotal: 0,
      pageSize: 30,
      pageSizeOptions: ['30','50','80','100'],
      pageNum: 1,
      tableDataList: [],
      previewVisible: false,
      previewImage: ``,
      tableIsLoading: false,
      startTime: moment(new Date()),
      endTime: null,
    };
    // window.airportTransfer = this;
    // window.moment = moment;
  }

  componentDidMount() {
    // 组件加载成功时
    this.getAirportInfo();
  }

  // 获取接送机用户信息
  // infoType: 0 - 送机, 1 - 接机
  getAirportInfo() {
    const { startTime, endTime, pageNum, pageSize, infoType } = this.state;
    this.setState({tableIsLoading: {spinning:true,tip:`正在加载中...`}});
    const dataObj = {
      pageNum: pageNum,
      pageSize: pageSize,
      startTime: startTime ? `${moment(startTime).format('YYYY-MM-DD')} 00:00:00` : null,
      endTime: endTime ? `${moment(endTime).format('YYYY-MM-DD')} 23:59:59` : null,
    };
    this.ajax.post(`/airportManagement/${infoType === 0 ? `getAirportDropInfo` : `getAirportPickInfo`}`,dataObj).then(r => {
      if (r.data.status === 10000) {
        const { data } = r.data;
        // 成功获取数据, 处理表单
        this.setState({
          tableIsLoading: false,
          tableDataList: data.list,
          pageTotal: data.total,
          pageSizeOptions: ['30','50','80',`${data.total > 100 ? data.total : 100}`],
        })
      }
      this.setState({tableIsLoading: false});
      r.showError();
    }).catch(r => {
      this.ajax.isReturnLogin(r,this)
    });
  }

  // 起始时间校验
  disabledStartTime(current) {
    const { endTime, } = this.state;
    // 这里表示, 如果该时间点晚于(大于)某一时间点, 则不可选
    // 校验的current为选择框内所有日期值, 做穷举判断
    return current > moment(endTime)
  }
  // 结束时间校验
  disabledEndTime(current) {
    const { startTime, } = this.state;
    // 该时间点早于(小于)某一时间点
    return current < moment(startTime)
  }

  // 翻页事件
  changePage(pageNum,pageSize) {
    this.setState({pageNum:pageNum,pageSize:pageSize},() => {
      this.getAirportInfo();
    });
  }
  // 详情
  showDetail(record) {
    const {infoType} = this.state;
    const style = {float:'left',width:'120px'}, hidden = {overflow:'hidden'};
    Modal.info({
      title: '查看订单信息',
      okText: '确定',
      okType: 'default',
      maskClosable: true,
      width: 400,
      content: <div style={hidden}>
        <div style={hidden}><div style={style}>创建时间: </div>{record.createTime}</div>
        <div style={hidden}><div style={style}>微信号: </div>{record.wechatNum}</div>
        <div style={hidden}>
          <div style={style}>{infoType === 0 ? `送机时间` : `接机时间`}: </div>
          {infoType === 0 ? record.takeoffTime : record.arrivalTime}
        </div>
        <div style={hidden}><div style={style}>用车人数: </div>{record.carMember}</div>
        <div style={hidden}><div style={style}>行李数: </div>{record.bagNum}</div>
        <div style={hidden}><div style={style}>用车类型: </div>{record.carChoice === 0 ? `拼车` : `专车(包车)`}</div>
        {infoType === 0
          ? <div style={hidden}><div style={style}>所在地址: </div>{record.location}</div>
          : <div style={hidden}>
            <div style={hidden}><div style={style}>目的地1: </div>{record.location1}</div>
            <div style={hidden}><div style={style}>目的地2: </div>{record.location2}</div>
            <div style={hidden}><div style={style}>目的地3: </div>{record.location3}</div>
          </div>
        }
      </div>
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const RadioButton = Radio.Button, RadioGroup = Radio.Group;
    const { pageTotal, pageSize, pageNum, tableDataList, infoType, previewVisible, previewImage, pageSizeOptions, tableIsLoading, startTime, endTime, } = this.state;
    const columns = [
      {title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160,
        render: (text, record) => (
          <div>{text? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''}</div>
        )
      },
      {title: '微信号', dataIndex: 'wechatNum', key: 'wechatNum', width: 140},
      {title: '机票照片', dataIndex: `${infoType === 0 ? `airportDropoffUrl` : `airportPickupUrl`}`, key: `${infoType === 0 ? `airportDropoffUrl` : `airportPickupUrl`}`, width: 140,
        render: (text, record) => (
          <Button type="default"
                  onClick={() => {
                    this.setState({
                      previewVisible: true,
                      previewImage: infoType === 0
                        // 自适应http/https协议
                        ? `//${record[`airportDropoffUrl`].split('//')[1]}`
                        : `//${record[`airportPickupUrl`].split('//')[1]}`
                    })
                  }}
          >点击查看</Button>
        ),},
      {title: `${infoType === 0 ? `送机时间` : `接机时间`}`, dataIndex: `${infoType === 0 ? `takeoffTime` : `arrivalTime`}`, key: `${infoType === 0 ? `takeoffTime` : `arrivalTime`}`},
      {title: '行李数', dataIndex: 'bagNum', key: 'bagNum', width: 80},
      {title: '操作', dataIndex: '操作', key: '操作', width: 100, fixed: 'right',
        render: (text, record) => (
          <div>
            <Button type="primary"
                    onClick={this.showDetail.bind(this, record)}
            >查看</Button>
          </div>
        ),
      }
    ];
    return (
      <div className="airportTransfer contentMain">
        <div className="title">
          <div className="titleMain">预约接送机</div>
          <div className="titleLine"/>
        </div>
        <RadioGroup buttonStyle="solid"
                    className="radioBtn"
                    value={infoType}
                    onChange={(e) => {
                      this.setState({infoType: e.target.value}, () => {
                        this.getAirportInfo()
                      })
                    }}
        >
          <RadioButton value={0}>送机用户信息</RadioButton>
          <RadioButton value={1}>接机用户信息</RadioButton>
        </RadioGroup>
        <div className="btnLine">
          <span>开始时间: </span>
          <DatePicker value={startTime}
                      onChange={(date, dateString) => this.setState({startTime: date})}
                      disabledDate={this.disabledStartTime.bind(this)}
          />
          <span style={{marginLeft: 10}}>结束时间: </span>
          <DatePicker value={endTime}
                      onChange={(date, dateString) => this.setState({endTime: date})}
                      disabledDate={this.disabledEndTime.bind(this)}
          />
          <Button type="primary"
                  style={{marginLeft: 10}}
                  onClick={this.getAirportInfo.bind(this, infoType, undefined, undefined)}
          >查询</Button>
        </div>
        <div className="tableMain"
             style={{maxWidth: 1000}}>
          <Table className="tableList"
                 dataSource={tableDataList}
                 columns={columns}
                 pagination={false}
                 bordered
                 scroll={{x: 800, y: 550}}
                 rowKey={(record, index) => `id_${index}`}
                 loading={tableIsLoading}
          />
          <Pagination className="tablePagination"
                      total={pageTotal}
                      pageSize={pageSize}
                      current={pageNum}
                      showTotal={(total, range) =>
                        `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 `}共 ${total} 条记录`}
                      onChange={this.changePage.bind(this)}
                      showSizeChanger
                      pageSizeOptions={pageSizeOptions}
                      onShowSizeChange={this.changePage.bind(this)}
          />
        </div>

        {/*图片预览弹窗*/}
        <Modal visible={previewVisible}
               width={600}
               footer={null}
               onCancel={() => {
                 this.setState({previewVisible: false, previewImage: ``})
               }}
        >
          <img alt="example" style={{width: '100%'}} src={previewImage}/>
        </Modal>
      </div>
    );
  }
}

export default airportTransfer;