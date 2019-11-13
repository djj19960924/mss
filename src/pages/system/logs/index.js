import React, { Component } from 'react'
import './index.less';
import {Table, Button,DatePicker,message,Modal,Input,Pagination } from "antd";
import moment from 'moment';
import { inject, observer } from 'mobx-react';

const ellipsis = {textOverflow:'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'};
const hidden = {overflow: 'hidden'};

class Logs extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            //开始时间默认当前时间前一周
            startTime: moment(new Date(new Date-7*24*3600*1000)),
            //结束时间默认当前时间
            endTime:moment(new Date()),
            tableIsLoading:false,
            tableDataList:[],
            // 分页相关
            pageTotal: 0,
            pageNum: 1,
            pageSize: 50,
            pageSizeOptions: [`50`,`100`,`200`,`300`],
            //关键字
            searchParam:'',
            // 显示弹窗
            showDetails: false,
        }
    }

    componentDidMount(){
        this.getLogsList()
    }

    //获取系统日志
    getLogsList() {
        const {startTime,endTime,searchParam,pageNum,pageSize} = this.state;
        this.setState({tableIsLoading: true});
        const dataObj = {
            startTime: startTime ? `${moment(startTime).format('YYYY-MM-DD')} 00:00:00` : null,
            endTime: endTime ? `${moment(endTime).format('YYYY-MM-DD')} 23:59:59` : null,
            parm:searchParam,
            pageNum,
            pageSize
        };
        this.ajax.post('/log/getLogList',dataObj).then(r=>{
            if(r.data.status === 9999){
                message.warning('当前未查询到数据');
                this.setState({
                    tableDataList:[],
                })
            }
            if(r.data.status === 10000){
                const { data } = r.data;
                console.log('data:',data)
                this.setState({
                    tableIsLoading: false,
                    tableDataList: data.list,
                    pageTotal: data.total,
                })
            }
            this.setState({tableIsLoading: false});
        }).catch(r => {
            console.error(r);
            this.setState({tableIsLoading: false});
            this.ajax.isReturnLogin(r,this)
        });
    }

    // 起始时间校验
    disabledStartTime(current) {
        const { endTime } = this.state;
        // 这里表示, 如果该时间点晚于(大于)某一时间点, 则不可选
        // 校验的current为选择框内所有日期值, 做穷举判断
        return current > moment(endTime)
    }
    // 结束时间校验
    disabledEndTime(current) {
        const { startTime } = this.state;
        // 该时间点早于(小于)某一时间点
        return current < moment(startTime)
    }

    changeSearchParam(e){
        this.setState({
            searchParam:e.target.value
        })
    }
    // 翻页事件
    changePage(pageNum,pageSize) {
        this.setState({
            pageNum:pageNum,
            pageSize:pageSize
        },() => {
            this.getLogsList();
        });
    }
    // 打开弹窗
    showDetails(record) {
        const style = {float:'left',width:'120px',color: '#333', fontWeight: 'bold'},
              hidden = {overflow:'hidden'}
        Modal.info({
            title: '查看系统日志详情',
            icon: 'info-circle',
            okText: '确定',
            maskClosable: true,
            width: 500,
            content: (
                <div>
                    <div>
                        <div style={style}>日志ID:</div> {record.id}
                    </div>
                    <div>
                        <div style={style}>操作时间:</div>{record.createTime ?
                        moment(record.createTime).format(`YYYY-MM-DD HH:mm:ss`) : '无'}
                    </div>
                    <div>
                        <div style={style}>账号名称:</div>{record.username}
                    </div>
                    <div>
                        <div style={style}>账号名称:</div>{record.operation}
                    </div>
                    <div>
                        <div style={style}>IP地址:</div>{record.ip}
                    </div>
                    <div style={Object.assign({whiteSpace: 'pre-wrap'},hidden)}>
                        <div style={style}>请求方法:</div>{record.method?record.method:'无'}
                    </div>
                    <div style={Object.assign({whiteSpace: 'pre-wrap'},hidden)}>
                        <div style={style}>请求参数:</div>{record.params?record.params:'无'}
                    </div>
                </div> 
            )
        })
    }

    columns = [
        {title: '日志ID', dataIndex: 'id', key: 'id', width: 80},
        {title: '操作时间', dataIndex: 'createTime', key: 'createTime', width: 160,
            render: val => (
                <div>{val ? moment(val).format(`YYYY-MM-DD HH:mm:ss`) : '无'}</div>
            )
        },
        {title: '账号名称',dataIndex: 'username', key: 'username', width: 80},
        {title: '功能名称',dataIndex: 'operation', key: 'operation',width: 80 },
        {title: 'IP地址',dataIndex: 'ip', key: 'ip'},
        {title: '请求方法',dataIndex: 'method', key: 'method', width: 180,
            render: val => (
                <div style={Object.assign(ellipsis)}
                     title={val}
                >{val}</div>
            )
        },
        {title: '请求参数',dataIndex: 'params', key: 'params', width: 240,
            render: val => (
                <div style={Object.assign( ellipsis)}
                    title={val}
                >{val}</div>
            )
        },
        {title: '操作',dataIndex: '操作', width: 100,fixed: 'right',
            render: (text, record) => 
                <div>
                    <Button type="primary"
                        onClick={this.showDetails.bind(this,record)}
                    >查看</Button>
                </div>
        }
    ];

    render() { 
        const {
            startTime,
            endTime,
            tableDataList,
            tableIsLoading,
            pageTotal,
            pageSize,
            pageNum,
            pageSizeOptions,
            searchParam,
        } = this.state;
        return ( 
            <div className="logs contentMain">
                <div className="title">
                    <div className="titleMain">系统日志表</div>
                    <div className="titleLine"/>
                </div>
                <div className="btnLine">
                    <Input 
                        placeholder="输入关键字查询" 
                        style={{width:180,marginLeft: 10,marginRight:10}}
                        className="shopName"
                        value={searchParam} 
                        onChange={this.changeSearchParam.bind(this)}/>

                    <span style={{marginRight: 10}}>开始时间: </span>
                    <DatePicker value={startTime}
                        onChange={(date, dateString) => this.setState({startTime: date})}
                        disabledDate={this.disabledStartTime.bind(this)}
                    />
                    <span style={{marginLeft: 10}}>结束时间: </span>
                    <DatePicker value={endTime}
                                    onChange={(date, dateString) => this.setState({endTime: date})}
                                    disabledDate={this.disabledEndTime.bind(this)}
                        style={{marginLeft: 10}}
                    />

                    <Button type="primary"
                            style={{marginLeft: 10}}
                            onClick={this.getLogsList.bind(this)}
                    >查询</Button>
                </div>

                <div className="tableMain"
                    style={{maxWidth: 1200}}
                >
                    {/*表单主体*/}
                    <Table className="tableList"
                        id="tableList"
                        dataSource={tableDataList}
                        columns={this.columns}
                        pagination={false}
                        loading={tableIsLoading}
                        bordered
                        scroll={{ y: 550, x: 1000 }}
                        rowKey={(record, index) => `id_${index}`}
                    />
                    {/*分页*/}
                    <Pagination className="tablePagination"
                        total={pageTotal}
                        pageSize={pageSize}
                        current={pageNum}
                        showTotal={(total, range) =>
                        `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 ` }共 ${total} 条记录`
                        }
                        onChange={this.changePage.bind(this)}
                        showSizeChanger
                        pageSizeOptions={pageSizeOptions}
                        onShowSizeChange={this.changePage.bind(this)}
                    />
                </div>
            </div>
         );
    }
}
 
export default Logs;