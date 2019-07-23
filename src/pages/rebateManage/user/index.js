import React from 'react';
import { Button, Table, Pagination,Form, } from 'antd';
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

    render() {
        const { tableDataList, tableIsLoading, pageTotal, pageSize, pageNum, pageSizeOptions} = this.state;
        
        const columns = [
            {title:'用户ID',dataIndex:'unionId',key:'unionId',width:299},
            {title:'用户昵称',dataIndex:'nickname',key:'nickname',width:137},
            {title:'姓名',dataIndex:'passportName',key:'passportName',width:125},
            {title:'手机号',dataIndex:'phoneNum',key:'phoneNum',width:130},
            {title:'护照号',pass:'passportNum',key:'passportNum',width:130},
            {title:'申请小票张数',dataIndex:'reciptTotal',key:'reciptTotal',width:100},
            {title:'首次申请时间',dataIndex:'firstApplyTime',key:'firstApplyTime',width:133,
                render(val){
                    return <span>{ val ? moment(Number(val)).format('YYYY-MM-DD HH:mm:ss') : ''}</span>
                }
                
            },
            {title:'最新提现方式',dataIndex:'payment',key:'payment',width:110},
            {title:'返现金额',dataIndex:'returningMoney',key:'returningMoney',width:80},
            {title:'余额',dataIndex:'balance',key:'balance',width:80},
            {title: '操作', dataIndex: '操作', key: '操作', width: 250, fixed: 'right',
                render: (text, record) =>
                    <div>
                        <Button type="primary"
                        >设置</Button>
                        {<Button type="primary"
                                style={{marginLeft: 10}}    
                        >返现</Button>}
                        {<Button type="primary"
                                style={{marginLeft: 10}}     
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
                    style={{maxWidth: 1500}}
                >
                    {/*表单主体*/}

                    <Table className="tableList"
                           id="tableList"
                           dataSource={tableDataList}
                           columns={columns}
                           pagination={false}
                           loading={tableIsLoading}
                           bordered
                           scroll={{ y: 550, x: 1585 }}
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
