import React from 'react';
import { Button, Table, Pagination,Form,Modal} from 'antd';
import { inject, observer } from 'mobx-react/index';
import './index.less';
import moment from 'moment'

@inject('appStore') @observer @Form.create()
class user extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            //表单数据
            tableDataList: [],
            //表单加载状态
            tableIsLoading: false,
            //分页相关
            pageTotal: 0,
            pageNum: 1,
            pageSize: 100,
            pageSizeOptions: [`50`,`100`,`200`,`300`],
            //当前用户信息
            currentInfo: {}
        }
    }

    componentDidMount() {
        this.getUserList()
    }
    //获取用户列表
    getUserList() {
        const { pageNum, pageSize } = this.state;
        this.setState({tableIsLoading: true});
        let dataObj = {pageNum: pageNum, pageSize: pageSize};
        this.ajax.post('/programUser/getRebateUserInfo',dataObj).then(r => {
            console.log('r:',r)
            if(r.data.status === 10000){
                this.setState({
                    tableDataList: r.data.data,
                    pageTotal: r.data.data.length
                });
            }
            r.showError();
            this.setState({tableIsLoading: false});
        }).catch(r => {
          console.error(r);
          this.setState({tableIsLoading: false});
          this.ajax.isReturnLogin(r,this);
        })
    }

    //换页刷新
    changePage(pageNum, pageSize) {
      this.setState({
        pageNum: pageNum,
        pageSize: pageSize,
      },()=>{
        this.getUserList();
      })
    }
    
    //查看返点用户详情
    showDetail(record){
        const style = {float:'left',width:'120px',marginBottom:'10px'}, hidden = {overflow:'hidden'};
        Modal.info({
            title: '返点用户信息',
            okText: '确定',
            okType: 'default',
            maskClosable: true,
            content: <div style={hidden}>
                <div style={hidden}><div style={style}>护照号: </div><div style={style}>{record.passportNum?`${record.passportNum}`:'无'}</div></div>
                <div style={hidden}><div style={style}>申请小票张数: </div><div style={style}>{record.reciptTotal?`${record.reciptTotal}`:'无'}</div></div>
                <div style={hidden}><div style={style}>首次申请时间: </div><div style={style}>{moment(Number(record.passportNum)).format('YYYY-MM-DD HH:mm:ss')?`${moment(Number(record.passportNum)).format('YYYY-MM-DD HH:mm:ss')}`:'无'}</div></div>
                <div style={hidden}><div style={style}>最新提现方式: </div><div style={style}>{record.payment?`${record.payment}`:'无'}</div></div>
                <div style={hidden}><div style={style}>返现金额: </div><div style={style}>{record.returningMoney?`${record.returningMoney}`:'无'}</div></div>
                <div style={hidden}><div style={style}>余额: </div><div style={style}>{record.balance?`${record.balance}`:'无'}</div></div>
            </div>
        })
    }

    render() {
        const { tableDataList, tableIsLoading, pageTotal, pageSize, pageNum, pageSizeOptions} = this.state;
        
        const columns = [
            {title:'用户ID',dataIndex:'unionId',key:'unionId',width:310,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            {title:'用户昵称',dataIndex:'nickname',key:'nickname',width:210,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            {title:'姓名',dataIndex:'passportName',key:'passportName',width:140,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            {title:'手机号',dataIndex:'phoneNum',key:'phoneNum',width:140,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            
            {title: '操作', dataIndex: '操作', key: '操作', width: 300, fixed: 'right',
                render: (text, record) =>
                    <div>
                        <Button type="primary"
                            onClick={this.showDetail.bind(this,record)}
                        >查看</Button>
                        <Button type="primary"
                        style={{marginLeft: 5}} >设置</Button>
                        {<Button type="primary"
                                style={{marginLeft: 5}}    
                        >返现</Button>}
                        {<Button type="primary"
                                style={{marginLeft: 5}}     
                        >追加</Button>}
                    </div>
            }
        ]
        
        return (
            <div className="accounts">
                <div className="title">
                    <div className="titleMain">用户表管理</div>
                    <div className="titleLine" />
                </div>

                <div className="tableMain"
                    style={{maxWidth: 1100}}
                >
                    {/*表单主体*/}

                    <Table className="tableList"
                           id="tableList"
                           dataSource={tableDataList}
                           columns={columns}
                           pagination={false}
                           loading={tableIsLoading}
                           bordered
                           scroll={{ y: 550, x: 1100 }}
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
                                pageSizeOptions={pageSizeOptions}
                                onShowSizeChange={this.changePage.bind(this)}
                    />
                    
                </div>
            </div>
        )
    }
}

export default user;
