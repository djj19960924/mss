import React, { Component } from 'react'
import {Table, Pagination, Button, Modal,Input,Form,message,Select } from "antd";
import axios from 'axios';
import moment from 'moment';
import './index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
class CustomerLevel extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            pageNum: 1,
            pageSize: 50,
            pageSizeOptions: ['50','100','200','500'],
            tableDataList:[],
            pageTotal:0,
            tableIsLoading:false,
            detailState: 'add',
            // 显示弹窗
            showDetails: false,
        }
    }
    componentDidMount() {
        this.getLevelList();
    }

    //获取客户级别
    getLevelList(){
        const { pageNum, pageSize, } = this.state;
        this.setState({tableIsLoading: true});
        const dataObj = {
            pageNum:pageNum,
            pageSize:pageSize,
            parm:{}
        }
        axios.post('http://192.168.31.211:8080/customer/getLevels',dataObj).then(r=>{
            if(r.data.status===10000){
                const { data } = r.data;
                console.log(data)
                this.setState({
                    tableIsLoading: false,
                    tableDataList: data.list,
                    pageTotal: data.total
                })
            }
            this.setState({tableIsLoading: false});
        })
    }
    columns = [
        {title: '级别ID', dataIndex: 'id', key: 'id', width: 80},
        {title: '级别名称', dataIndex: 'levelName', key: 'levelName', width: 120},
        {title: '级别说明', dataIndex: 'description', key: 'description'},
        {title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180,
            render:(text)=>{
                return (
                    <div>{text?moment(text).format(`YYYY-MM-DD`):"暂无"}</div>
                )
            }
        },
        {title: '创建人', dataIndex: 'creator', key: 'creator', width: 80},
        {title: '备注', dataIndex: 'note', key: 'note'},
        {title: '操作', dataIndex: '操作', key: '操作', width: 120, fixed: 'right',
            render: (text, record) =>
            <div>
                <Button type="primary"
                    style={{marginLeft: 10}}
                    onClick={this.showDetailsModal.bind(this,'edit',record)}
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
    // 打开弹窗
    showDetailsModal(type,record){
        const { setFieldsValue, resetFields } = this.props.form;
        resetFields();
        this.setState({
            detailState: type,
            showDetails: true,
            currentInfo: record ? record : {}
        },() => {
            if(type==="edit") setFieldsValue({
                levelName:record.levelName,
                description:record.description,
                note:record.note
            })
        })
    }

    //级别
    changeLevel(dataObj,type){
        axios.post(`http://192.168.31.211:8080/customer/${type}`,dataObj).then(r=>{
            console.log("r:",r)
        })
    }

    //提交表单
    submitForm(){
        const {validateFields} = this.props.form;
        const {detailState, currentInfo} = this.state;
        const creator = document.cookie.split(";")[0].split("=")[1];
        validateFields((err,val)=>{
            if(!err){
                const dataObj = {
                    levelName:val.levelName,
                    description:val.description,
                    note:val.note
                }
                if(detailState === 'add'){
                    dataObj.creator = creator;
                    this.changeLevel(dataObj, 'addLevel');
                }else if(detailState==="edit") {
                    dataObj.id = currentInfo.id;
                    this.changeLevel(dataObj,'updateLevel');
                }
            }
        })
    }
    
    render() { 
        const { 
            pageNum,
            pageSize,
            tableDataList,
            tableIsLoading,
            pageTotal,
            pageSizeOptions,
            detailState,
            showDetails
        } = this.state;
        const { getFieldDecorator } = this.props.form;
        return ( 
            <div className="customerLevel contentMain">
                <div className="title">
                    <div className="titleMain">客户级别管理</div>
                    <div className="titleLine"/>
                </div>
                <div className="btnLine">
                    <Button type="primary"
                        onClick = {this.showDetailsModal.bind(this,'add')}
                    >新增级别</Button>
                </div>

                <Modal className="details"
                       title={detailState === 'add' ? '新增级别' : '修改级别'}
                       visible={showDetails}
                       width={400}
                       onCancel={() => this.setState({showDetails: false})}
                       onOk={this.submitForm.bind(this)}
                >
                    <Form labelCol={{span: 6}}
                        wrapperCol={{span: 12}}
                    >
                        <FormItem label="级别名称" colon >
                            {getFieldDecorator('levelName', {
                                rules: [{required: true, message: '请输入级别名称!'}]
                                })( <Input placeholder="请输入级别名称" /> )
                            }
                        </FormItem>
                        <FormItem label="级别说明" colon >
                            {getFieldDecorator('description', {
                                rules: [{required: true, message: '请输入级别说明!'}]
                                })( <Input placeholder="请输入级别说明" /> )
                            }
                        </FormItem>
                        <FormItem label="级别备注" colon >
                            {getFieldDecorator('note', {
                                rules: [{required: true, message: '请输入级别备注!'}]
                                })( <Input placeholder="请输入级别备注" /> )
                            }
                        </FormItem>
                    </Form>   
                </Modal>

                <div className="tableMain"
                    style={{maxWidth: 1000}}>
                    <Table className="tableList"
                        dataSource={tableDataList}
                        columns={this.columns}
                        bordered
                        scroll={{x: 950, y: 550}}
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
         );
    }
}
 
export default CustomerLevel;