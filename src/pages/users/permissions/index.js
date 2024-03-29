import React from 'react';
import { Button, Table, message, Modal, Input, Form, Select,Pagination } from 'antd';
import { observer } from 'mobx-react/index';
import './index.less';

@observer @Form.create()
class permissions extends React.Component {
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
      pageSize: 30,
      pageSizeOptions: [`30`,`50`,`100`,`200`],
      // 显示弹窗
      showDetails: false,
      detailState: 'detail',
      // 当前账户信息
      currentInfo: {},
      parentIdObject: {},
      //所有父级菜单列表
      parentIdArr:[]
    };
  }

  componentDidMount() {
    this.getPermissionList();
    this.getAllPermissionList();
  }

  // 权限列表分页
  getPermissionList() {
    const { pageNum, pageSize } = this.state;
    this.setState({tableIsLoading: true});
    let dataObj = {pageNum: pageNum, pageSize: pageSize};
    this.ajax.post('/permission/getPermissionList',dataObj).then(r => {
      console.log('r:',r)
      const {data, status} = r.data;
      if (status === 10000) {
        this.setState({
          tableDataList: data.list,
          pageTotal: data.total,
          tableIsLoading: false
        });
      }
      r.showError(message); 
    }).catch(r => {
      console.error(r);
      this.setState({tableIsLoading: false});
      this.ajax.isReturnLogin(r,this);
    })
  }

  // 所有权限列表
  getAllPermissionList() {
    const Option = Select.Option;
    const { parentIdObject } = this.state;
    this.ajax.get('/permission/getMenuList').then(r => {
      const {data, status} = r.data;
      if (status === 10000) {
        parentIdObject['0'] = '根目录';
        for (let Obj of data) parentIdObject[`${Obj.id}`] = Obj.menuName;
        const parentIdList = [<Option key='0'>根目录</Option>];
        for(let i of data) if(i.type === 1) parentIdList.push(<Option key={Number(i.id)}>{i.menuName}</Option>);
        this.setState({
          parentIdObject,
          parentIdList
        });
      }
      r.showError(message); 
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r,this);
    })
  }

  // 换页刷新
  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize,
    },()=>{
      this.getPermissionList();
    })
  }

  //打开弹窗
  showDetails(state, record) {
    const { setFieldsValue, resetFields } = this.props.form;
    resetFields();
    const data = {
      detailState: state,
      currentInfo: record ? record : {},
      showDetails: true
    };
    if(state === "add"){
      this.setState(data, () => {
        setFieldsValue({
          type: 1,
          parentId: '0',
        })
      });
    }else{
      this.setState(data, () => {
        if(state === 'edit') setFieldsValue({
          menuName: record.menuName,
          type: record.type,
          parentId: `${record.parentId}`,
          requiredPermission: record.requiredPermission,
          url:record.url
        })
      });
    } 
  }

  // 删除权限
  deleteUser(id) {
    Modal.confirm({
      title: '删除权限',
      content: '确认删除该权限',
      okText: '删除',
      okType: 'danger',
      maskClosable: true,
      onOk: () => {
        this.ajax.delete(`/permission/deletePermission/${id}`).then(r => {
          if (r.data.status === 10000) {
            message.success(r.data.msg);
            this.getPermissionList();
          }
          r.showError();
        }).catch(r => {
          console.error(r);
          this.ajax.isReturnLogin(r,this);
        })
      }
    });
  }
  //修改权限
  changePermission(dataObj,type){
    this.ajax.post(`/permission/${type}`,dataObj).then(r => {
      if(r.data.status === 10000) {
        message.success(r.data.msg);
        this.setState({showDetails: false});
        this.getPermissionList();
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r,this);
    })
  }
  submitForm() {
    //validateField方法对表单字段进行校验
    const {validateFields} = this.props.form;
    const {detailState, currentInfo} = this.state;
    validateFields((err, val) => {
      if (!err){
        const dataObj = {
          menuName : val.menuName,
          parentId : val.parentId,
          requiredPermission : val.requiredPermission,
          type : val.type,
          url : val.url
        };
        if (detailState === 'add') {
          if(!dataObj.requiredPermission){
            dataObj.requiredPermission = 2
          }
          this.changePermission(dataObj, 'addPermissions');
        } else if (detailState === 'edit') {
          if(dataObj.type === 1){
            dataObj.requiredPermission = 2
          }
          dataObj.id = currentInfo.id;
          this.changePermission(dataObj, 'updatePermission');
        }
      }
    })
  }
  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const Option = Select.Option;
    const FormItem = Form.Item;
    const { getFieldDecorator } = this.props.form;
    const { tableDataList, tableIsLoading, pageSizeOptions,pageSize,pageTotal,pageNum,detailState, showDetails, currentInfo, parentIdObject,parentIdList } = this.state;
    const columns = [
      {title: '权限id', dataIndex: 'id', key: 'id', width: 80},
      {title: '权限名称', dataIndex: 'menuName', key: 'menuName', width: 140},
      {title: '权限类型', dataIndex: 'type', key: 'type', width: 140,
        render: text => <div>{text === 1 ? '菜单权限' : '功能权限'}</div>
      },
      {title: '是否必须', dataIndex: 'requiredPermission', key: 'requiredPermission', width: 140,
        render: (text, record) => {
          let main = '否';
          if (record.type === 1) {
            main = '菜单无此项数据';
          } else {
            if (text === 1) main = '是';
          }
          return <div style={record.type === 1 ? {color: '#ddd'} : null}>{main}</div>;
        }
      },
      {title: '父级权限', dataIndex: 'parentIdText', key: 'parentIdText', width: 120,
        render: (text, record) => <div>{parentIdObject[`${record.parentId}`]}</div>
      },
      {title: '父级权限id', dataIndex: 'parentId', key: 'parentId', width: 80},
      {title: '操作', dataIndex: '操作', key: '操作', width: 250, fixed: 'right',
        render: (text, record) =>
          <div>
            <Button type="primary"
                    onClick={this.showDetails.bind(this,'detail',record)}
            >查看</Button>
            <Button type="primary"
                    style={{marginLeft: 10}}
                    onClick={this.showDetails.bind(this,'edit',record)}
            >修改</Button>
            <Button type="danger"
                    style={{marginLeft: 10}}
                    onClick={this.deleteUser.bind(this,record.id)}
            >删除</Button>
          </div>
      },
    ];

    return (
      <div className="permissions contentMain">
          <div className="title">
            <div className="titleMain">权限管理</div>
            <div className="titleLine"/>
          </div>
          <div className="btnLine">
            <Button type="primary"
                    onClick={this.showDetails.bind(this, 'add', undefined)}
            >新增权限</Button>
          </div>
          <Modal className="details"
                wrapClassName="accountsDetailsModal"
                title={detailState === 'edit' ? '修改权限' : (detailState === 'add' ? '新增权限' : '查看权限')}
                visible={showDetails}
                bodyStyle={{padding: 18, maxHeight: '600px', overflow: 'auto'}}
                width={500}
                onCancel={() => this.setState({showDetails: false})}
                onOk={this.submitForm.bind(this)}
                okText={detailState === 'edit' ? '修改' : (detailState === 'add' ? '新增' : '')}
                footer={detailState === 'detail' ? null : undefined}
            //  forceRender={true}
          >
            <Form className=""
                  labelCol={{span: 8}}
                  wrapperCol={{span: 16}}
            >
              <FormItem label="权限名称" colon>
                {detailState !== 'detail' ?
                  getFieldDecorator('menuName', {
                    rules: [{required: true, message: '请输入权限名称!'}],
                  })(<Input placeholder="请输入权限名称"/>)
                  : <div>{currentInfo.menuName}</div>
                }
              </FormItem>
              <FormItem label="权限类型" colon>
                {detailState !== 'detail' ?
                  getFieldDecorator('type', {
                    rules: [{required: true, message: '请选择角色!'}],
                  })(<Select placeholder="请选择角色">
                      <Option value={1}>菜单权限</Option>
                      <Option value={2}>功能权限</Option>
                    </Select>
                  ) : <div>{currentInfo.type === 1 ? "菜单权限" : "功能权限"}</div>
                }
              </FormItem>
              {
                this.props.form.getFieldValue('type') === 1 ? '' :
                  <FormItem label="是否必须" colon>
                    {detailState !== 'detail' ?
                      getFieldDecorator('requiredPermission', {
                        rules: [{required: true, message: '是否必须'}],
                      })(<Select placeholder="是否必须">
                          <Option value={1}>是</Option>
                          <Option value={2}>否</Option>
                        </Select>
                      ) :
                      <div>{currentInfo.type === 1 ? '菜单无此项数据' : (currentInfo.requiredPermission === 1 ? '是' : '否')}</div>
                    }
                  </FormItem>
              }

              <FormItem label="父级权限" colon>
                {detailState !== 'detail' ?
                  getFieldDecorator('parentId', {
                    rules: [{required: true, message: '请选择父级权限!'}],
                  })(<Select>
                      {parentIdList}
                    </Select>
                  ) : <div>{parentIdObject[currentInfo.parentId]}</div>
                }
              </FormItem>

              {
                this.props.form.getFieldValue('type') === 1 ? '' :
                  (<FormItem label="权限url" colon>
                    {detailState !== 'detail' ?
                      getFieldDecorator('url', {
                        rules: [{required: true, message: '请输入权限url!'}],
                      })(<Input placeholder="请输入权限url"/>)
                      : <div>{!currentInfo.url ? '无' : currentInfo.url}</div>
                    }
                  </FormItem>)
              }
            </Form>
          </Modal>

          <div className="tableMain">
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
    );
  }
}

export default permissions;