import React, { Component } from 'react';
import {Table, Pagination, Button, Modal,Input,Form,message,Select } from "antd";
import axios from 'axios';
import './index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
class CustomerInfo extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            pageNum: 1,
            pageSize: 50,
            pageSizeOptions: ['50','100','200','500'],
            tableDataList:[],
            pageTotal:0,
            tableIsLoading:false,
            showDetails:false,
            // 当前客户信息
            currentInfo: {},
        }
    }
    componentDidMount() {
        this.getCustomerList()
    }

    //获取所有客户信息列表
    getCustomerList() {
        const { pageNum, pageSize, } = this.state;
        this.setState({tableIsLoading: true});
        const dataObj = {
            pageNum:pageNum,
            pageSize:pageSize,
            parm:{}
        }
        axios.post('http://192.168.31.211:8080/customerManage/getList',dataObj).then(r=>{
            if(r.data.status===10000){
                const { data } = r.data; 
                this.setState({
                    tableIsLoading: false,
                    tableDataList: data.list,
                    pageTotal: data.total
                })
            }
            this.setState({tableIsLoading: false});
        })
    }
    
    //获取客户所有级别
    getAllLevel(){
        
    }

    //跳转详情页
    toDetail(id) {
        this.props.history.push({
            pathname:'/customer/customerInfo/customerInfoDetail',
            query: {id :id}
        });
        localStorage.setItem("id",id);
    }
    //打开弹窗
    showDetail(record){
        const { setFieldsValue, resetFields } = this.props.form;
        resetFields();
        const data = {
            currentInfo: record ? record : {},
            showDetails: true
        };
        this.setState(data,()=>{
            setFieldsValue({
                note:record.note,
                levelId:record.levelId
            })
        })
    }

    
    columns = [
        {title: '客户ID', dataIndex: 'id', key: 'id', width: 80},
        {title: '账号(手机号)', dataIndex: 'phone', key: 'phone', width: 120},
        {title: '客户备注', dataIndex: 'note', key: 'note'},
        {title: '客户级别', dataIndex: 'levelId', key: 'levelId', width: 80},
        {title: '头像', dataIndex: 'headImgUrl', key: 'headImgUrl', width: 60,
            render: text => {
                if(text) {
                    return <img src={text} alt=""
                        style={{width:40,height:40,display:'block'}}
                    />
                } else {
                    return <div style={{width: 40, height: 40,lineHeight: '40px'}}>无</div>
                }
            }
        },
        {title: '昵称', dataIndex: 'nickname', key: 'nickname'},
        {title: '余额', dataIndex: 'balance', key: 'balance', width: 100},
        {title: '操作', dataIndex: '操作', key: '操作', width: 180, fixed: 'right',
            render: (text, record) =>
            <div>
                <Button type="primary"
                    onClick = {this.toDetail.bind(this,record.id)}
                >查看</Button>
                <Button type="primary"
                    style={{marginLeft: 10}}
                    onClick={() => this.showDetail(record)}
                >编辑</Button>
            </div>
        },
    ]
    // 翻页事件
    changePage(pageNum,pageSize) {
        this.setState({pageNum:pageNum,pageSize:pageSize},() => {
            this.getCustomerList();
        });
    }
    
    render() { 
        const { 
            pageNum,
            pageSize,
            tableDataList,
            tableIsLoading,
            pageTotal,
            pageSizeOptions,
            showDetails,
            currentInfo
        } = this.state;
        const {getFieldDecorator} = this.props.form;
        return ( 
            <div className="customerInfo contentMain">
                <div className="title">
                    <div className="titleMain">客户管理</div>
                    <div className="titleLine"/>
                </div>
                <div className="tableMain"
                    style={{maxWidth: 1200}}>
                    <Table className="tableList"
                        dataSource={tableDataList}
                        columns={this.columns}
                        bordered
                        scroll={{x: 1000, y: 550}}
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

                <Modal width={400}
                    title="编辑客户" 
                    visible={showDetails}   
                    onCancel={() => this.setState({showDetails: false})}
                    // onOk={this.submitForm}
                >
                    <Form>
                        <FormItem
                            label="客户昵称"
                            colon
                            labelCol={{span: 7}}
                            wrapperCol={{span: 12}}
                        > 
                            <div>{currentInfo.nickname}</div>
                        </FormItem>

                        <FormItem
                            label="客户备注"
                            colon
                            labelCol={{span: 7}}
                            wrapperCol={{span: 12}}
                        >   
                        {getFieldDecorator('note')(
                            <Input placeholder="请输入客户备注"/>
                        )}
                        </FormItem>
                        <FormItem
                            label="客户级别"
                            colon
                            labelCol={{span: 7}}
                            wrapperCol={{span: 12}}
                        >   
                        {getFieldDecorator('levelId',{
                            rules: [{required: true, message: '请选择用户级别!'}],
                        })(
                            <Select placeholder="请选择角色">
                                <Option value={1}>一级</Option>
                                <Option value={2}>二级</Option>
                                <Option value={3}>三级</Option>
                                <Option value={4}>最高级</Option>
                            </Select>
                        )}
                        </FormItem>
                    </Form>
                </Modal>
            </div>
         );
    }
}
 
export default CustomerInfo;