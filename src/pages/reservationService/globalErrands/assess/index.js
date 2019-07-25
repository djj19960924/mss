import React from 'react';
import { Button, Table, Pagination,Form, Modal, } from 'antd';
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
        this.ajax.post('/legworkBackend/getEvaluationList',dataObj).then(r => {
            if(r.data.status === 10000){
                this.setState({
                    tableDataList: r.data.data.list,
                    pageTotal: r.data.data.total
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

    //查看详情
    showDetail(record){
        const style = {float:'left',width:'100px',marginBottom:'10px',fontSize:'16px'}, hidden = {overflow:'hidden'};
        const styleContent = {float:'left',width:'200px',marginBottom:'10px',fontSize:'16px',marginLeft:'10px'}
        Modal.info({
            title: '用户评价信息',
            okText: '确定',
            okType: 'default',
            maskClosable: true,
            content: <div style={hidden}>
                <div style={hidden}><div style={style}>首次申请时间: </div><div style={styleContent}>{moment(Number(record.evaluationTime)).format('YYYY-MM-DD HH:mm:ss')?`${moment(Number(record.evaluationTime)).format('YYYY-MM-DD HH:mm:ss')}`:'无'}</div></div>
                <div style={hidden}><div style={style}>微信号: </div><div style={styleContent}>{record.wechatNo?`${record.wechatNo}`:'无'}</div></div>
                <div style={hidden}><div style={style}>微信昵称: </div><div style={styleContent}>{record.nickname?`${record.nickname}`:'无'}</div></div>
                <div style={hidden}><div style={style}>客服: </div><div style={styleContent}>{record.buyer?`${record.buyer}`:'无'}</div></div>
                <div style={hidden}><div style={style}>买手: </div><div style={styleContent}>{record.servicer?`${record.servicer}`:'无'}</div></div>
                <div style={hidden}><div style={style}>满意度: </div><div style={styleContent}>{record.evaluation?`${record.evaluation}`:'无'}</div></div>
                <div style={hidden}><div style={style}>备注: </div><div style={styleContent}>{record.opinion?`${record.opinion}`:'无'}</div></div>
                <div style={hidden}><div style={style}>订单内容: </div><div style={styleContent}>{record.orderContent?`${record.orderContent}`:'无'}</div></div>
            </div>
        })
    }

    // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
    componentWillUnmount() {
        this.setState = () => null
    }

    render() {
        const { tableDataList, tableIsLoading, pageTotal, pageSize, pageNum, pageSizeOptions} = this.state;
        
        const columns = [
            {title:'评价时间',dataIndex:'evaluationTime',key:'evaluationTime',width:160,
                render(val){
                    return <div>{ val ? moment(Number(val)).format('YYYY-MM-DD HH:mm:ss') : '无'}</div>
                }
                
            },
            {title:'微信号',dataIndex:'wechatNo',key:'wechatNo',width:130,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            {title:'微信昵称',dataIndex:'nickname',key:'nickname',width:200,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            {title:'客服',dataIndex:'servicer',key:'servicer',width:160,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                }        
            },
            {title:'买手',dataIndex:'buyer',key:'buyer',width:140,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            {title:'满意度',dataIndex:'evaluation',key:'evaluation',width:80,
                render(val){
                    return (<div>{val?val:'无'}</div>)
                } 
            },
            {
                title: '操作', dataIndex: '操作', key: '操作', width: 100, fixed: 'right',
                render: (text,record) => (
                    <Button type="primary"
                        onClick={this.showDetail.bind(this,record)}
                    >
                        查看
                    </Button>
                )
            }
        ]
        
        return (
            <div className="accounts">
                <div className="title">
                    <div className="titleMain">用户评价表</div>
                    <div className="titleLine" />
                </div>

                <div className="tableMain"
                    style={{maxWidth: 1000}}
                >
                    {/*表单主体*/}

                    <Table className="tableList"
                           id="tableList"
                           dataSource={tableDataList}
                           columns={columns}
                           pagination={false}
                           loading={tableIsLoading}
                           bordered
                           scroll={{ y: 600, x: 950 }}
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
