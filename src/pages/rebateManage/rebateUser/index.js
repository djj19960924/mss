import React from 'react';
import { Button, Table, Pagination,Form,Modal} from 'antd';
import { inject, observer } from 'mobx-react/index';
import './index.less';
import moment from 'moment'

@inject('appStore') @observer @Form.create()
class rebateUser extends React.Component {
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
        const style = {float:'left',width:'100px',marginBottom:'10px',fontSize:'16px'}, hidden = {overflow:'hidden'};
        const styleContent = {float:'left',width:'200px',marginBottom:'10px',fontSize:'16px',marginLeft:'10px'}
        Modal.info({
            title: '返点用户信息',
            okText: '确定',
            okType: 'default',
            maskClosable: true,
            content: <div style={hidden}>
                <div style={hidden}><div style={style}>用户ID: </div><div style={styleContent}>{record.unionId?`${record.unionId}`:'无'}</div></div>
                <div style={hidden}><div style={style}>用户昵称: </div><div style={styleContent}>{record.nickname?`${record.nickname}`:'无'}</div></div>
                <div style={hidden}><div style={style}>姓名: </div><div style={styleContent}>{record.passportName?`${record.passportName}`:'无'}</div></div>
                <div style={hidden}><div style={style}>手机号: </div><div style={styleContent}>{record.phoneNum?`${record.phoneNum}`:'无'}</div></div>
                <div style={hidden}><div style={style}>护照号: </div><div style={styleContent}>{record.passportNum?`${record.passportNum}`:'无'}</div></div>
                <div style={hidden}><div style={style}>申请小票张数: </div><div style={styleContent}>{record.reciptTotal?`${record.reciptTotal}`:'无'}</div></div>
                <div style={hidden}><div style={style}>首次申请时间: </div><div style={styleContent}>{moment(Number(record.firstApplyTime)).format('YYYY-MM-DD HH:mm:ss')?`${moment(Number(record.firstApplyTime)).format('YYYY-MM-DD HH:mm:ss')}`:'无'}</div></div>
                <div style={hidden}><div style={style}>最新提现方式: </div><div style={styleContent}>{record.payment?`${record.payment}`:'无'}</div></div>
                <div style={hidden}><div style={style}>返现金额: </div><div style={styleContent}>{record.returningMoney?`${record.returningMoney}`:'无'}</div></div>
                <div style={hidden}><div style={style}>余额: </div><div style={styleContent}>{record.balance?`${record.balance}`:'无'}</div></div>
            </div>
        })
    }

    render() {
        const { tableDataList, tableIsLoading, pageTotal, pageSize, pageNum, pageSizeOptions} = this.state;
        const hasInfo = val => <div>{val ? val : '无'}</div>;
        const columns = [
            {title: '用户ID', dataIndex: 'unionId', key: 'unionId', width: 310, render: hasInfo},
            {title: '用户昵称', dataIndex: 'nickname', key: 'nickname', width: 200, render: hasInfo},
            {title: '姓名', dataIndex: 'passportName', key: 'passportName', width: 130, render: hasInfo},
            {title: '手机号', dataIndex: 'phoneNum', key: 'phoneNum', width: 130, render: hasInfo},
            {title: '操作', dataIndex: '操作', key: '操作', width: 330, fixed: 'right',
                render: (text, record) =>
                  <div>
                      <Button type="primary"
                              onClick={this.showDetail.bind(this, record)}
                      >查看</Button>
                      <Button type="primary"
                              style={{marginLeft: 10}}>设置</Button>
                      {<Button type="primary"
                               style={{marginLeft: 10}}
                      >返现</Button>}
                      {<Button type="primary"
                               style={{marginLeft: 10}}
                      >追加</Button>}
                  </div>
            }
        ];
        
        return (
            <div className="rebateUser contentMain">
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

export default rebateUser;
