import React from 'react';
import {Button, Input, message, Pagination, Table,} from 'antd';
import moment from 'moment';
import {inject, observer} from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class globalTranshipmentNotArrived extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 表单数据
      tableDataList: [],
      // 物流单号搜索框
      searchParam: '',
      // 表单加载状态
      tableIsLoading: false,
      // 按钮加载
      updateBtnIsLoading: false,
      // 所选数据数组
      selectedList: [],
      // 所选行数数组
      selectedIds: [],
      // 分页相关
      pageTotal: 0,
      pageNum: 1,
      pageSize: 100,
      pageSizeOptions: [`50`,`100`,`200`,`300`]
    }
  }
  allow = this.props.appStore.getAllow.bind(this);
  componentDidMount() {
    this.isWareHouseParcelMessage();
  }
  // 后台根据仓库是否收货以及物流单号模糊查询
  isWareHouseParcelMessage() {
    const {pageNum, pageSize, searchParam} = this.state;
    const showLoading = Is => {this.setState({tableIsLoading: Is})};
    showLoading(true);
    const data = {
      pageNum: pageNum,
      pageSize: pageSize,
      logistics: searchParam,
      isWarehouse: 0
    };
    this.ajax.post('/parcelMessage/isWareHouseParcelMessage', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          tableDataList: data.list, pageTotal: data.total,
          pageSizeOptions: [`50`,`100`,`200`,`${data.total > 300 ? data.total : 300}`]
        })
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      console.error(r);
      showLoading(false);
      this.ajax.isReturnLogin(r, this);
    });
  }
  // 根据id列表修改到仓状态
  updateParcelMessage() {
    const {selectedIds} = this.state;
    const showLoading = Is => {this.setState({updateBtnIsLoading: Is})};
    showLoading(true);
    this.ajax.post('/parcelMessage/updateParcelMessage', selectedIds).then(r => {
      if (r.data.status === 10000) {
        message.success(r.data.msg);
        this.isWareHouseParcelMessage();
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }
  // 改变页码
  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize,
    },() => {
      this.isWareHouseParcelMessage();
    })
  }
  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { tableDataList, tableIsLoading, selectedIds, pageTotal, pageSize, pageNum, pageSizeOptions, updateBtnIsLoading, searchParam, } = this.state;
    const Search = Input.Search;
    const columns = [
      {title: `物流ID`, dataIndex: `id`, key: 'id', width: 90},
      {title: `物流单号`, dataIndex: `logistics`, key: 'logistics', width: 180},
      {title: `更新时间`, dataIndex: `updateTime`, key: 'updateTime', width: 180,
        render: text => <div>{!text ? '' : moment(text).format('YYYY-MM-DD HH:mm:ss')}</div>
      },
      {title: `包裹重量(kg)`, dataIndex: `weight`, key: 'weight', width: 90},
      {title: `微信号`, dataIndex: `wechatNo`, key: 'wechatNo'},
    ];
    return (
      <div className="globalTranshipmentNotArrived">
        <div className="title">
          <div className="titleMain">全球转运 - 货物未到仓</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <Button type="primary"
                  className="updateParcelMessage"
                  onClick={this.allow(98) ? this.updateParcelMessage.bind(this) : null}
                  disabled={!this.allow(98) || selectedIds.length === 0}
                  title={!this.allow(98) ? '没有该操作权限' : ''}
                  loading={updateBtnIsLoading}
          >点击确认到仓</Button>
          <Search placeholder="输入物流单号"
                  className="searchInput"
                  onSearch={() => this.isWareHouseParcelMessage()}
                  value={searchParam}
                  onChange={e => this.setState({searchParam:e.target.value})}
                  style={{width: 200,marginLeft: 10}}
          />
        </div>
        <div className="tableMain"
             style={{maxWidth: 1000}}
        >
          {/*表单主体*/}
          <Table className="tableList"
                 dataSource={tableDataList}
                 columns={columns}
                 pagination={false}
                 loading={tableIsLoading}
                 bordered
                 rowSelection={{
                   selectedRowKeys: selectedIds,
                   // 选择框变化时触发
                   onChange: (selectedRowKeys, selectedRows) => {
                     // console.log(selectedRowKeys, selectedRows);
                     this.setState({
                       selectedIds: selectedRowKeys,
                       selectedList: selectedRows,
                     });
                   },
                 }}
                 scroll={{ y: 550, x: 800 }}
                 rowKey={(record, index) => `${record.id}`}
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

export default globalTranshipmentNotArrived;