import React from 'react';
import { Button, Table, message, Pagination, Modal, Input, Form, Select, } from 'antd';
import { inject, observer } from 'mobx-react/index';
import './index.less';

@inject('appStore') @observer @Form.create()
class accounts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 表单数据
      tableDataList: [],
      // 表单加载状态
      tableIsLoading: false,
      // 分页相关
      pageTotal: 0,
      pageNum: 1,
      pageSize: 100,
      pageSizeOptions: [`50`,`100`,`200`,`300`],
      // 显示弹窗
      showDetails: false,
      detailState: 'detail',
      // 角色选择项
      rolesOptions: [],
      // 角色对应表
      rolesObject: {},
      // 当前账户信息
      currentInfo: {},
    };
  }

  allow = this.props.appStore.getAllow.bind(this);

  componentDidMount() {
    this.getRoleList();
  }

  // 查询用户列表
  getUserList() {
    const { pageNum, pageSize } = this.state;
    this.setState({tableIsLoading: true});
    let dataObj = {pageNum: pageNum, pageSize: pageSize};
    this.ajax.post('/user/getUserList',dataObj).then(r => {
      if (r.data.status === 10000) {
        this.setState({
          tableDataList: r.data.data.list,
          pageTotal: r.data.data.total,
          tableIsLoading: false
        });
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.setState({tableIsLoading: false});
      this.ajax.isReturnLogin(r,this);
    })
  }

  // 获取角色列表
  getRoleList() {
    const Option = Select.Option;
    this.setState({tableIsLoading: true});
    this.ajax.get('/role/getList').then(r => {
      if (r.data.status === 10000) {
        this.getUserList();
        let dataList = [], dataObj = {};
        for (let obj of r.data.data) {
          dataList.push(<Option key={obj.id} value={obj.id}>{obj.roleName}</Option>);
          dataObj[`${obj.id}`] = obj.roleName;
        }
        this.setState({rolesOptions: dataList,rolesObject:dataObj})
      }
      r.showError();
      this.setState({tableIsLoading: false});
    }).catch(r => {
      console.error(r);
      this.setState({tableIsLoading: false});
      this.ajax.isReturnLogin(r,this);
    })
  }

  // 换页刷新
  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize,
    },()=>{
      this.getUserList();
    })
  }

  // 打开弹窗
  showDetails(state,record) {
    const { setFieldsValue, resetFields } = this.props.form;
    resetFields();
    this.setState({
      detailState: state,
      showDetails: true,
      currentInfo: record ? record : {}
    }, () => {
      if (state !== 'detail') setFieldsValue({
        company: record.company,
        email: record.email,
        roleId: record.roleId,
        userName: record.userName,
        phone: record.phone,
      })
    });
    
  }

  // 删除用户
  deleteUser(id) {
    Modal.confirm({
      title: '删除账户',
      content: '确认删除该账户',
      okText: '删除',
      okType: 'danger',
      maskClosable: true,
      onOk: () => {
        this.ajax.delete('/user/deleteUser/'+id).then(r => {
          if (r.data.status === 10000) {
            message.success(r.data.msg);
            this.getUserList();
          }
          r.showError();
        }).catch(r => {
          console.error(r);
          this.ajax.isReturnLogin(r,this);
        })
      }
    });
  }

  // 修改用户
  changeUser(dataObj,type) {
    this.ajax.post(`/user/${type}`,dataObj).then(r => {
      if (r.data.status === 10000) {
        message.success(r.data.msg);
        this.setState({showDetails: false});
        this.getUserList();
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r,this);
    })
  }

  // 提交表单
  submitForm() {
    const {validateFields} = this.props.form;
    const {detailState, currentInfo} = this.state;
    validateFields((err, val) => {
      if (!err) {
        const dataObj = {
          userName: val.userName,
          roleId: val.roleId,
          email: val.email ? val.email.trim() : '',
          phone: val.phone ? val.phone.trim() : '',
          company: val.company ? val.company.trim() : '',
        };
        if (val.password) dataObj.password = val.password;
        if (detailState === 'add') {
          this.changeUser(dataObj, 'addUser');
        } else if (detailState === 'edit') {
          dataObj.id = currentInfo.id;
          this.changeUser(dataObj, 'updateUser');
        }
      }
    })
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { tableDataList, tableIsLoading, pageTotal, pageSize, pageNum, pageSizeOptions, detailState, showDetails, rolesOptions, currentInfo, rolesObject, } = this.state;
    const FormItem = Form.Item;
    const { getFieldDecorator } = this.props.form;
    const columns = [
      {title: '账户id', dataIndex: 'id', key: 'id', width: 80},
      {title: '账户名称', dataIndex: 'userName', key: 'userName', width: 140},
      {title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140},
      {title: '角色名称', dataIndex: 'role', key: 'roleIdForName',
        render: (text, record) => <div>{rolesObject[`${record.roleId}`]}</div>
      },
      {title: '角色id', dataIndex: 'roleId', key: 'roleId', width: 80},
      {title: '操作', dataIndex: '操作', key: '操作', width: 250, fixed: 'right',
        render: (text, record) =>
          <div>
            <Button type="primary"
                    onClick={this.showDetails.bind(this,'detail',record)}
            >查看</Button>
            {this.allow(4) && <Button type="primary"
                    style={{marginLeft: 10}}
                    onClick={this.showDetails.bind(this,'edit',record)}
            >修改</Button>}
            {this.allow(5) && <Button type="danger"
                    style={{marginLeft: 10}}
                    onClick={this.deleteUser.bind(this,record.id)}
            >删除</Button>}
          </div>
      },
    ];
    return (
      <div className="accounts contentMain">
          <div className="title">
            <div className="titleMain">账户管理</div>
            <div className="titleLine" />
          </div>
          <div className="btnLine">
            {this.allow(3) && <Button type="primary"
                    onClick={this.showDetails.bind(this,'add')}
            >新增账户</Button>}
          </div>
          <Modal className="details"
                wrapClassName="accountsDetailsModal"
                title={detailState === 'edit' ? '修改账户' : (detailState === 'add' ? '新增账户' : '账户详情')}
                visible={showDetails}
                bodyStyle={{padding: 18,maxHeight: '600px',overflow: 'auto'}}
                width={500}
                onCancel={() => this.setState({showDetails: false})}
                onOk={this.submitForm.bind(this)}
                okText={detailState === 'edit' ? '修改' : (detailState === 'add' ? '新增' : '')}
                footer={detailState === 'detail' ? null : undefined}
          >
            {/* 用户名称/邮箱/电话/公司/角色 */}
            <Form className=""
                  labelCol={{span: 8}}
                  wrapperCol={{span: 16}}
            >
              <FormItem label="账户名称" colon >
                {detailState !== 'detail' ?
                  getFieldDecorator('userName', {
                    rules: [{required: true, message: '请输入账户名称!'}],
                  })( <Input placeholder="请输入账户名称" /> )
                  : <div>{currentInfo.userName}</div>
                }
              </FormItem>
              <FormItem label="角色名称" colon >
                {detailState !== 'detail' ?
                  getFieldDecorator('roleId', {
                    rules: [{required: true, message: '请选择角色!'}]
                  })( <Select placeholder="请选择角色" >{rolesOptions}</Select> )
                  : <div>{rolesObject[currentInfo.roleId]}</div>
                }
              </FormItem>
              <FormItem label="密码" colon style={detailState === 'detail' ? {display: 'none'} : {}}>
                {getFieldDecorator('password', {
                  rules: [{required: (detailState === 'add'), message: '请输入密码!'}]
                })( <Input placeholder={`${detailState === 'add' ? '请输入密码' : '如需修改, 请输入新密码'}`} /> )}
              </FormItem>
              <FormItem label="邮箱" colon >
                {detailState !== 'detail' ?
                  getFieldDecorator('email')( <Input placeholder="请输入邮箱" /> )
                  : <div>{currentInfo.email||'暂无'}</div>
                }
              </FormItem>
              <FormItem label="电话" colon >
                {detailState !== 'detail' ?
                  getFieldDecorator('phone')( <Input placeholder="请输入电话" /> )
                  : <div>{currentInfo.phone||'暂无'}</div>
                }
              </FormItem>
              <FormItem label="公司" colon >
                {detailState !== 'detail' ?
                  getFieldDecorator('company')( <Input placeholder="请输入公司名称" /> )
                  : <div>{currentInfo.company||'暂无'}</div>
                }
              </FormItem>
            </Form>
          </Modal>
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
                  scroll={{ y: 550, x: 900 }}
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
    )
  }
}

export default accounts;