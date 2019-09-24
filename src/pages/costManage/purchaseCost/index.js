import React from "react";
import {Table, Pagination, Button, Modal,DatePicker,Input,Select,Form,message } from "antd";
import { inject, observer } from 'mobx-react';
import './index.less';
import moment from 'moment';
import XLSX from 'xlsx';
import {addNum,accMul} from '@js/calculateTool'

const { Option } = Select;
const { confirm } = Modal;

@inject('appStore') @observer
class PurchaseCost extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            //开始时间默认当前时间前一周
            startTime: moment(new Date(new Date-7*24*3600*1000)),
            //结束时间默认当前时间
            endTime:moment(new Date()),
            attribute:null,
            productName:"",
            pageNum: 1,
            pageSize: 50,
            pageSizeOptions: ['50','100','200','500'],
            tableDataList:[],
            currentPrice:0,
            currentCost:0,
            pageTotal:0,
            tableIsLoading:false
        }
    }

    // 导出推单模板excel
    exportExcel () {
        const elt = document.getElementById('tableList');
        const wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
        XLSX.writeFile(wb, `采购成本表 ${moment(new Date()).format('YYYYMMDD-HHmmss')}.xlsx`);
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
        {title: '商场',dataIndex: 'mallName', key: 'mallName', width: 120,
            render(val){
                return <span>{val?val:'无'}</span>
            }
        },
        {title: '商品ID',dataIndex: 'productId', key: 'productId',width: 80 },
        {title: '商品名称',dataIndex: 'productName', key: 'productName', width: 200},
        {title: '数量', dataIndex: 'number', key: 'number', width: 60},
        {title: '单价(美元)', dataIndex: 'unitPrice', key: 'unitPrice', width: 60},
        {title: '单个成本(美元)', dataIndex: 'cost', key: 'cost',width: 80},
        {title: '入库成本', dataIndex: 'costPrice', key: 'costPrice', width: 100},
        {title: '返点金额', dataIndex: 'reciptMoney', key: 'reciptMoney', width: 100,
            render(val){
                return <span>{ val ? val :'无'}</span>
            }
        },
        {title: '护照', dataIndex: 'passportName', key: 'passportName', width: 120,
            render(val){
                return <span>{ val ? val :'无'}</span>
            }
        },
        {title: '微信名', dataIndex: 'wechatName', key: 'wechatName', width: 100}
    ];

    allow = this.props.appStore.getAllow.bind(this);

    componentDidMount(){
        this.getPurchaseCostList()
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
    //获取采购成本数据
    getPurchaseCostList(){
        const {pageNum, pageSize,attribute,startTime,endTime,productName,pageTotal,tableDataList,currentPrice} = this.state;
        this.setState({tableIsLoading: true});
        const dataObj = {
            pageNum: pageNum,
            pageSize: pageSize,
            startTime: startTime ? `${moment(startTime).format('YYYY-MM-DD')} 00:00:00` : null,
            endTime: endTime ? `${moment(endTime).format('YYYY-MM-DD')} 23:59:59` : null,
            attribute:attribute,
            productName:productName,
        }
        this.ajax.post('/backend/productCost/selectProductCostByCondition',dataObj).then(r => {
            if(r.data.status === 9999){
                message.error('当前未查询到数据');
                this.setState({
                    tableDataList:[],
                    currentPrice:0,
                    currentCost:0
                })
            }
            if(r.data.status === 10000){
                const { data } = r.data;
                var currentList = data.list;
                //新建当前页总采购金额currentPrice
                var currentPrice = 0;
                //新建当前页总采购成本currentCost
                var currentCost = 0;
                for(let i =0 ;i<currentList.length;i++){
                    if(!currentList[i].number||!currentList[i].cost||!currentList[i].unitPrice){
                        currentList[i].number,currentList[i].cost,currentList[i].unitPrice =0
                    }
                    currentPrice = addNum(currentPrice,accMul(currentList[i].number,currentList[i].unitPrice))
                    currentCost = addNum(currentCost,accMul(currentList[i].number,currentList[i].cost)) 
                }
                
                this.setState({
                    tableIsLoading: false,
                    tableDataList: data.list,
                    pageTotal: data.total,
                    currentPrice:currentPrice,
                    currentCost:currentCost
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
    changeProductName(e){
        this.setState({
            productName:e.target.value
        })
    }

    // 翻页事件
    changePage(pageNum,pageSize) {
        this.setState({pageNum:pageNum,pageSize:pageSize},() => {
            this.getPurchaseCostList();
        });
    }

    handleExport(){
        Modal.confirm({
            title: "是否确定导出成本采购表？",
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
            pageSize,
            pageNum,
            pageSizeOptions,
            productName,
            tableDataList,
            tableIsLoading,
            pageTotal,
            currentPrice,
            currentCost
        } = this.state;
        return (
            <div className="purchaseCost contentMain">
                <div className="title">
                    <div className="titleMain">采购成本表</div>
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
                        placeholder="输入商品名" 
                        style={{width:180,marginLeft: 10,marginRight:10}}
                        className="shopName"
                        value={productName} 
                        onChange={this.changeProductName.bind(this)}/>
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
                            onClick={this.getPurchaseCostList.bind(this)}
                    >查询</Button>
                </div>
                <div className="btnLine">
                    
                    当前页总采购金额{currentPrice||0}美元，成本{currentCost||0}美元
                </div>
                <div className="btnLine">
                    <Button type="primary"
                            onClick={this.handleExport.bind(this)}
                            disabled={!this.allow(87)}
                            title={!this.allow(87) ? '没有该操作权限' : null}
                    >导出excel</Button>
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


export default PurchaseCost;