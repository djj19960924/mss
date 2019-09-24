import React from "react";
import {Table, Pagination, Button, Modal,DatePicker,Input,Select,Form,message } from "antd";
import { inject, observer } from 'mobx-react';
import './index.less';
import moment from 'moment';
import XLSX from 'xlsx';
import {addNum} from '@js/calculateTool'

const { Option } = Select;
const { confirm } = Modal;

@inject('appStore') @observer
class RebateDetail extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            //开始时间默认当前时间前一周
            startTime: moment(new Date(new Date-7*24*3600*1000)),
            //结束时间默认当前时间
            endTime:moment(new Date()),
            passportName:"",
            tableIsLoading:false,
            pageNum: 1,
            pageSize: 50,
            pageSizeOptions: ['50','100','200','500'],
            tableDataList:[],
            pageTotal:0,
            attribute:null,
            currentDollar:0
        }
    }
    // 导出推单模板excel
    exportExcel () {
        const elt = document.getElementById('tableList');
        const wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
        XLSX.writeFile(wb, `返点明细表 ${moment(new Date()).format('YYYYMMDD-HHmmss')}.xlsx`);
    }

    columns = [
        {title: '购买日期', dataIndex: 'consumeDate', key: 'consumeDate', width: 100,
            render(val){
                return <span>{val ? val :'无' }</span>;
            }
        },
        {title: '类别', dataIndex: 'attribute', key: 'attribute', width: 100,
            render(val){
                return <span>{val===1?'MG':(val===0?'SG':'无')}</span>
            }
        },
        {title: '商场',dataIndex: 'mallName', key: 'mallName', width: 120},
        {title: '小票ID',dataIndex: 'receiptId', key: 'receiptId',width: 80 },
        {title: '品牌',dataIndex: 'brandName', key: 'brandName', width: 120},
        {title: '返点率', dataIndex: 'rebateRate', key: 'rebateRate', width: 60},
        {title: '原价美金', dataIndex: 'originalPrice', key: 'originalPrice', width: 80},
        {title: '实付美金', dataIndex: 'consumeMoney', key: 'consumeMoney',width: 80},
        {title: '返点美金', dataIndex: 'reciptDollar', key: 'reciptDollar', width: 100},
        {title: '返点韩币', dataIndex: 'reciptKorean', key: 'reciptKorean', width: 100},
        {title: '返点人民币', dataIndex: 'reciptMoney', key: 'reciptMoney', width: 100},
        {title: '护照', dataIndex: 'passportName', key: 'passportName', width: 120},
    ];

    allow = this.props.appStore.getAllow.bind(this);

    componentDidMount(){
        this.getRebateDetailList()
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
    //获取返点明细数据
    getRebateDetailList(){
        const {pageNum, pageSize,attribute,startTime,endTime,passportName,currentDollar} = this.state;
        this.setState({tableIsLoading: true});
        const dataObj = {
            pageNum: pageNum,
            pageSize: pageSize,
            startTime: startTime ? `${moment(startTime).format('YYYY-MM-DD')} 00:00:00` : null,
            endTime: endTime ? `${moment(endTime).format('YYYY-MM-DD')} 23:59:59` : null,
            attribute:attribute,
            passportName:passportName,
        }
        this.ajax.post('/backend/productCost/selectReciptByCondition',dataObj).then(r =>{
            if(r.data.status === 9999){
                message.error('当前未查询到数据');
                this.setState({
                    tableDataList:[],
                    currentDollar:0
                })
            }
            if(r.data.status === 10000){
                const { data } = r.data;
                var currentList = data.list;
                //新建当前页总原价美元currentDollar
                var currentDollar = 0;
                for(let i =0 ;i<currentList.length;i++){
                    if(!currentList[i].reciptDollar){
                        currentList[i].reciptDollar =0
                    }
                    currentDollar = addNum(currentDollar,currentList[i].originalPrice)
                }
                this.setState({
                    tableIsLoading: false,
                    tableDataList: data.list,
                    pageTotal: data.total,
                    currentDollar:currentDollar
                })
            }
            this.setState({tableIsLoading: false});

        }).catch(r => {
            this.ajax.isReturnLogin(r,this)
        });
    }

    handleChange(value){
        this.setState({
            attribute:value
        })
    }
    changePassportName(e){
        this.setState({
            passportName:e.target.value
        })
    }

    test(){
        
    }

    // 翻页事件
    changePage(pageNum,pageSize) {
        this.setState({pageNum:pageNum,pageSize:pageSize},() => {
            this.getRebateDetailList();
        });
    }

    handleExport(){
        Modal.confirm({
            title: "是否确定导出返点明细表？",
            okText: "确定",
            cancelText: "取消",
            onOk:()=>{
                this.exportExcel()
            }
        })
    }

    render(){
        const {
            startTime,
            endTime,
            passportName,
            tableIsLoading,
            pageSize,
            tableDataList,
            pageSizeOptions,
            pageTotal,
            pageNum,
            currentDollar
        } = this.state;
        return (
            <div className="rebateDetail contentMain">
                <div className="title">
                    <div className="titleMain">返点明细表</div>
                    <div className="titleLine"/>
                </div>

                <div className="btnLine">
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
                    <Input 
                        placeholder="输入护照姓名" 
                        style={{width:180,marginLeft: 10,marginRight:10}}
                        className="shopName"
                        value={passportName} 
                        onChange={this.changePassportName.bind(this)}/>
                    <span>类型:</span>
                    <Select 
                        placeholder="请选择类型" 
                        onChange={this.handleChange.bind(this)} 
                        style={{marginLeft: 10,width: 120}}
                    >
                        <Option value="">全部</Option>
                        <Option value="0">SG</Option>
                        <Option value="1">MG</Option>
                    </Select>
                    <Button type="primary"
                            style={{marginLeft: 10}}
                            onClick={this.getRebateDetailList.bind(this)}
                    >查询</Button>
                </div>
                
                <div className="btnLine">
                    当前页总原价{currentDollar}美金
                </div>

                <div className="btnLine">
                    <Button type="primary"
                            onClick={this.handleExport.bind(this)}
                            disabled={!this.allow(87)}
                            title={!this.allow(87) ? '没有该操作权限' : null}
                    >导出excel</Button>

                    {
                        // <Button type="primary"
                        //     onClick={this.test.bind(this)}
                        //     disabled={!this.allow(87)}
                        //     title={!this.allow(87) ? '没有该操作权限' : null}
                        //     style={{marginLeft:'10px'}}
                        // >导入</Button>
                    }
                </div>

                <div className="tableMain"
                    style={{maxWidth: 1350}}>
                    <Table className="tableList"
                        id="tableList" 
                        dataSource={tableDataList}
                        columns={this.columns}
                        bordered
                        scroll={{x: 1300, y: 550}}
                        rowKey={(record, index) => `id_${index}`}
                        loading={tableIsLoading}
                        pagination={false}
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
            </div>
        )
    }
}


export default RebateDetail;