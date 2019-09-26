import React from "react";
import {Table, Button,DatePicker,message } from "antd";
import './index.less';
import moment from 'moment';

class TicketCost extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            //开始时间默认当前时间前一周
            startTime: moment(new Date(new Date-7*24*3600*1000)),
            //结束时间默认当前时间
            endTime:moment(new Date()),
            tableIsLoading:false,
            tableDataList:[],
        }
    }

    columns = [
        {title: '属性', dataIndex: 'reciptAttribute', key: 'reciptAttribute', width: 40},
        {title: '实际总价(美元)', dataIndex: 'attribute', key: 'attribute', width: 60,
            render(val){
                return <span>{val ? val : 0 }</span>;
            }
        },
        {title: '原价总价(美元)',dataIndex: 'originalPriceSum', key: 'originalPriceSum', width: 60},
        {title: '返点美金总额',dataIndex: 'reciptDollarSum', key: 'reciptDollarSum',width: 60 },
        {title: '返点韩币总额',dataIndex: 'reciptKoreanSum', key: 'reciptKoreanSum', width: 60}
    ];

    

    componentDidMount(){
        this.getTicketCostList()
    }

    //获取小票成本数据
    getTicketCostList(){
        const {startTime,endTime} = this.state;
        this.setState({tableIsLoading: true});
        const dataObj = {
            startTime: startTime ? `${moment(startTime).format('YYYY-MM-DD')} 00:00:00` : null,
            endTime: endTime ? `${moment(endTime).format('YYYY-MM-DD')} 23:59:59` : null,
        }
        this.ajax.post('/recipt/selectReciptAmountByTime',dataObj).then(r => {
            if(r.data.status === 9999){
                message.error('当前未查询到数据');
                this.setState({
                    tableDataList:[],
                })
            }
            if(r.data.status === 10000){
                const { data } = r.data;           
                this.setState({
                    tableIsLoading: false,
                    tableDataList: data
                })
            }

            this.setState({tableIsLoading: false});

        }).catch(r => {
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

    // 翻页事件
    changePage(pageNum,pageSize) {
        this.setState({pageNum:pageNum,pageSize:pageSize},() => {
            this.getTicketCostList();
        });
    }

    render(){
        const {
            startTime,
            endTime,
            tableDataList,
            tableIsLoading,
        } = this.state;

        return (
            <div className="TicketCost contentMain">
                <div className="title">
                    <div className="titleMain">小票成本表</div>
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
                    <Button type="primary"
                            style={{marginLeft: 10}}
                            onClick={this.getTicketCostList.bind(this)}
                    >查询</Button>
                </div>
                <div className="tableMain"
                    style={{maxWidth: 900}}>
                    <Table className="tableList"
                        id="tableList" 
                        dataSource={tableDataList}
                        columns={this.columns}
                        bordered
                        rowKey={(record, index) => `id_${index}`}
                        loading={tableIsLoading}
                        pagination={false}
                    />
                </div>
            </div>
        )
    }
}

export default TicketCost;