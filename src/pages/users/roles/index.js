import React from 'react';
import {Button, Input, message, Modal, Table, Icon} from 'antd';
import './index.less';

class roles extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 表单数据
      tableDataList: [],
      // 表单加载状态
      tableIsLoading: false,
      // 分页相关
      pageNum: 1,
      pageSize: 100,
      pageSizeOptions: [`50`,`100`,`200`,`300`],
      // 详情弹框
      showDetails: false,
      // 所有权限列表
      allPermissionsList: [],
      // 当前显示权限列表
      permissionsList: [],
      // 权限列表(源)
      originIdList: [],
      // 权限列表
      currentIdList: [],
      // 弹框是否可编辑
      detailState: 'detail',
      // 当前行
      currentRecord: {},
      // 原角色名称
      originRoleName: '',
      // 新增角色名称
      newRoleName: ''
    };
  }

  componentDidMount() {
    // 权限列表获取接口内部, 异步嵌套获取权限列表接口
    this.getPermissionList();
  }

  // 获取所有权限列表
  getPermissionList() {
    this.setState({tableIsLoading: true});
    this.ajax.post('/permission/getPermissionList').then(r => {
      if (r.data.status === 10000) {
        this.setState({allPermissionsList: r.data.data});
        this.getRoleList();
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r,this);
    })
  }

  // 获取角色列表
  getRoleList() {
    this.setState({tableIsLoading: true});
    this.ajax.post('/role/getRoleList').then(r => {
      if (r.data.status === 10000) {
        this.setState({
          tableDataList: r.data.data,
        });
      }
      r.showError();
      this.setState({tableIsLoading: false});
    }).catch(r => {
      console.error(r);
      this.setState({tableIsLoading: false});
      this.ajax.isReturnLogin(r, this);
    })
  }
  // 展示详情
  showDetailsModal(record, type) {
    const {allPermissionsList} = this.state;
    let dataList = [];
    const data = {
      detailState: type,
      currentRecord: record,
      permissionsList: allPermissionsList,
      showDetails: true,
    };
    if (record) for (let v of record.permissions) dataList.push(v.menuId);
    if (type === 'detail') {
      // 详情
      data.permissionsList = record.permissions;
    } else if (type === 'edit') {
      // 编辑
      data.originIdList = [...dataList];
      data.newRoleName = record.roleName;
      data.originRoleName = record.roleName;
    } else if (type === 'add') {
      // 新增
    }
    data.currentIdList = dataList;
    this.setState(data);
  }

  // 渲染 table 内部权限标签
  renderPermissions(text, record) {
    if (record.roleId === 1) {
      // 超级管理员显示全部
      return (
        <div className="tabsList">
          <span className="tabs allPer">全部</span>
        </div>
      )
    } else {
      // 其他角色显示相关菜单
      const dataList = [];
      // 循环处理, 菜单内部只显示最上级菜单页面
      for (let v of record.permissions) if (v.parentId === 0) dataList.push(v.name);
      return (
        <div className="tabsList">
          {dataList.map((item,index) =>
            <div className="tabs" key={index}>{item}</div>)}
        </div>
      )
    }
  }

  // 点击选择/取消选择某一权限
  changeOwn(id) {
    const {currentIdList} = this.state;
    let i = currentIdList.indexOf(id);
    if (i === -1) {
      currentIdList.push(id);
    } else {
      currentIdList.splice(i, 1);
    }
    // 渲染
    this.setState({});
  }

  // 修改角色
  updateRole() {
    const {originIdList, currentIdList, currentRecord, originRoleName, newRoleName} = this.state;
    let addList = [], delList = [];
    for (let v1 of currentIdList) if (!originIdList.includes(v1)) addList.push(v1);
    for (let v2 of originIdList) if (!currentIdList.includes(v2)) delList.push(v2);
    if (addList.length === 0 && delList.length === 0 && originRoleName === newRoleName) {
      message.warn('权限以及角色名均未改变');
    } else {
      let dataObj = {
        roleId: currentRecord.roleId,
        roleName: currentRecord.roleName,
        newMenuIdList: addList,
        oldMenuIdList: delList
      };
      this.ajax.post('/role/updateRole', dataObj).then(r => {
        // console.log(r);
        if (r.data.status === 10000) {
          message.success(`${r.data.msg}`);
          this.setState({showDetails: false});
          this.getRoleList();
        }
        r.showError();
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r,this);
      })
    }
  }

  // 新增角色
  addRole() {
    const { currentIdList, newRoleName } = this.state;
    let dataObj = {
      roleName: newRoleName,
      newMenuIdList: currentIdList
    };
    this.ajax.post('/role/addRole',dataObj).then(r => {
      // console.log(r);
      if (r.data.status === 10000) {
        message.success(`${r.data.data}`);
        this.setState({showDetails: false, newRoleName: ''});
        this.getRoleList();
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r,this);
    })
  }

  // 删除角色
  deleteRole(roleId) {
    Modal.confirm({
      title: '删除角色',
      content: '确认删除该角色',
      okText: '删除',
      okType: 'danger',
      maskClosable: true,
      onOk: () => {
        this.ajax.post('/role/deleteRole', {roleId: roleId}).then(r => {
          if (r.data.status === 10000) {
            message.success(`${r.data.msg}`);
            this.getRoleList();
          }
          r.showError();
        }).catch(r => {
          console.error(r);
          this.ajax.isReturnLogin(r, this);
        })
      }
    })
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const {tableDataList, tableIsLoading, pageSize, pageSizeOptions, showDetails, detailState, currentIdList, newRoleName, permissionsList} = this.state;
    const columns = [
      {title: 'ID', dataIndex: 'roleId', key: 'roleId', width: 80},
      {title: '角色名称', dataIndex: 'roleName', key: 'roleName', width: 140},
      {title: '权限', dataIndex: 'permissions', key: 'permissions',
        render: (text, record) => this.renderPermissions(text, record)
      },
      {title: '操作', dataIndex: '操作', key: '操作', width: 250, fixed: 'right',
        render: (text, record) => {
          if (record.roleId === 1) {
            return <div>
              <Button type="primary"
                      onClick={this.showDetailsModal.bind(this, record, 'detail')}
              >查看</Button>
              <Button type="primary"
                      style={{marginLeft: 10}}
                      onClick={this.showDetailsModal.bind(this, record, 'edit')}
              >修改</Button>
            </div>
          } else {
            return <div>
              <Button type="primary"
                      onClick={this.showDetailsModal.bind(this, record, 'detail')}
              >查看</Button>
              <Button type="primary"
                      style={{marginLeft: 10}}
                      onClick={this.showDetailsModal.bind(this, record, 'edit')}
              >修改</Button>
              <Button type="danger"
                      style={{marginLeft: 10}}
                      onClick={this.deleteRole.bind(this, record.roleId)}
              >删除</Button>
            </div>
          }
        }
      },
    ];
    return (
      <div className="roles contentMain">
        角色管理
        {
          // <div className="title">
          //   <div className="titleMain">角色管理</div>
          //   <div className="titleLine" />
          // </div>
          // <div className="btnLine">
          //   <Button type="primary"
          //           onClick={this.showDetailsModal.bind(this, undefined, 'add')}
          //   >新增角色</Button>
          // </div>
          // <Modal className="details"
          //       wrapClassName="rolesDetailsModal"
          //       title={detailState === 'edit' ? '修改角色' : (detailState === 'add' ? '新增角色' : '角色详情')}
          //       visible={showDetails}
          //       bodyStyle={{padding: 18,maxHeight: '600px',overflow: 'auto'}}
          //       width={760}
          //       onCancel={() => this.setState({showDetails: false})}
          //       onOk={() => {
          //         if (detailState === 'edit') this.updateRole();
          //         if (detailState === 'add') this.addRole();
          //       }}
          //       okText={detailState === 'edit' ? '修改' : (detailState === 'add' ? '新增' : '')}
          //       footer={detailState === 'detail' ? null : undefined}
          // >
          //   {detailState !== 'detail' &&
          //     <div className="addRole">
          //       <div className="addRoleTitle">{detailState === 'add' ? '新增' : '修改'}角色名:</div>
          //       <Input className="addRoleInput"
          //             value={newRoleName}
          //             onChange={e => {this.setState({newRoleName: e.target.value})}}
          //       />
          //     </div>
          //   }
          //   <div className="detailsMain">
          //     {/*渲染菜单*/}
          //     {permissionsList.map((item1,index) => {
          //       if (item1.parentId === 0) {
          //         return <div key={index}
          //                     className="menuLine"
          //         >
          //           <div className="menuName">
          //             <div onClick={(detailState !== 'detail') ? this.changeOwn.bind(this, item1.menuId) : null}
          //                 className={`menuNameTab ${detailState === 'detail' ? '' : 'can_edit'} ${currentIdList.includes(item1.menuId) ? 'own' : 'not_own'}`}
          //             >{item1.name}</div>
          //           </div>
          //           <div className="menuBody">{
          //             permissionsList.map((item2,index) => {
          //               if (item2.parentId === item1.menuId) {
          //                 if (item2.type === 2) {
          //                   return <div key={index}
          //                               onClick={(detailState !== 'detail') ? this.changeOwn.bind(this, item2.menuId) : null}
          //                               className={`apiName ${detailState === 'detail' ? '' : 'can_edit'} ${currentIdList.includes(item2.menuId) ? 'own' : 'not_own'}`}
          //                   >
          //                     {item2.requiredPermission === 1 ?
          //                       <Icon type="star" theme="filled" />
          //                       : ''
          //                     }{item2.name}</div>
          //                 } else {
          //                   return <div key={index}
          //                               className="menuLine"
          //                   >
          //                     <div className="menuName">
          //                       <div onClick={(detailState !== 'detail') ? this.changeOwn.bind(this, item2.menuId) : null}
          //                           className={`menuNameTab ${detailState === 'detail' ? '' : 'can_edit'} ${currentIdList.includes(item2.menuId) ? 'own' : 'not_own'}`}
          //                       >{item2.name}</div>
          //                     </div>
          //                     <div className="menuBody">{
          //                       permissionsList.map((item3,index) => {
          //                         if (item3.parentId === item2.menuId) {
          //                           if (item3.type === 2) {
          //                             return <div key={index}
          //                                         onClick={(detailState !== 'detail') ? this.changeOwn.bind(this, item3.menuId) : null}
          //                                         className={`apiName ${detailState === 'detail' ? '' : 'can_edit'} ${currentIdList.includes(item3.menuId) ? 'own' : 'not_own'}`}
          //                             >
          //                               {item3.requiredPermission === 1 ?
          //                                 <Icon type="star" theme="filled" />
          //                                 : ''
          //                               }{item3.name}</div>
          //                           } else {
          //                             return <div key={index}
          //                                         className="menuLine"
          //                             >
          //                               <div className="menuName">
          //                                 <div onClick={(detailState !== 'detail') ? this.changeOwn.bind(this, item3.menuId) : null}
          //                                     className={`menuNameTab ${detailState === 'detail' ? '' : 'can_edit'} ${currentIdList.includes(item3.menuId) ? 'own' : 'not_own'}`}
          //                                 >{item3.name}</div>
          //                               </div>
          //                               <div className="menuBody">{
          //                                 permissionsList.map((item4,index) => {
          //                                   if (item4.parentId === item3.menuId) {
          //                                     return <div key={index}
          //                                                 onClick={(detailState !== 'detail') ? this.changeOwn.bind(this, item4.menuId) : null}
          //                                                 className={`apiName ${detailState === 'detail' ? '' : 'can_edit'} ${currentIdList.includes(item4.menuId) ? 'own' : 'not_own'}`}
          //                                     >
          //                                       {item4.requiredPermission === 1
          //                                         ? <Icon type="star" theme="filled" />
          //                                         : ''
          //                                       }{item4.name}</div>
          //                                   }
          //                                 })
          //                               }</div>
          //                             </div>
          //                           }
          //                         }
          //                       })
          //                     }</div>
          //                   </div>
          //                 }
          //               }
          //             })
          //           }</div>
          //         </div>;
          //       }
          //     })}
          //   </div>
          // </Modal>
          // <div className="tableMain">
          //   {/*表单主体*/}
          //   <Table className="tableList"
          //         id="tableList"
          //         dataSource={tableDataList}
          //         columns={columns}
          //         pagination={{
          //           pageSize: pageSize,
          //           showTotal: (total, range) =>
          //             `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 ` }共 ${total} 条记录`,
          //           showSizeChanger: true,
          //           pageSizeOptions: pageSizeOptions,
          //         }}
          //         loading={tableIsLoading}
          //         bordered
          //         scroll={{ y: 500, x: 800 }}
          //         rowKey={(record, index) => `id_${index}`}
          //   />
          // </div>
        }
      </div>
    )
  }
}

export default roles;