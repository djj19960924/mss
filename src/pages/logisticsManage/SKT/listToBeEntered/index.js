import React from 'react';
import {Table, Pagination, Select} from 'antd';
import moment from 'moment';
import "./index.less";

const {Option} = Select;
class SKTListToBeEntered extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isEntry: 0,
      currentShopId: null,
      shopList: [<Option key={null} value={null}>全部商场</Option>],
      // 分页状态
      pageNum: 1,
      pageSize: 100,
      pageTotal: 0,
      // 每页显示数据条数选择框
      pageSizeOptions: [`50`, `100`, `200`, `300`],
      // 表单加载中显示
      tableIsLoading: false,
    };
    // window.SKTListToBeEntered = this;
  }
  componentDidMount() {
    this.getAllSpeedexpressShop();
  }
  // 获取速跨通商店列表
  getAllSpeedexpressShop() {
    const {shopList} = this.state;
    this.ajax.post('/portal/speedexpress/getAllSpeedexpressShop').then(r => {
      if (r.data.status === 10000) {
        const shopObj = {};
        for (let v of r.data.data) {
          shopList.push(<Option key={v.id} value={v.id}>{v.shopName}</Option>);
          shopObj[v.id] = v.shopName;
        }
        this.setState({shopObj},() => {
          this.queryIsEntrySpeedexpress();
        });
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 通过是否已录入获取速跨通列表
  queryIsEntrySpeedexpress() {
    const {pageNum, pageSize, isEntry, currentShopId} =this.state;
    const data = {pageNum, pageSize, isEntry};
    const showLoading = Is => this.setState({tableIsLoading: Is});
    showLoading(true);
    if (currentShopId !== null) data.shopId = currentShopId;
    this.ajax.post('/backend/speedexpress/queryIsEntrySpeedexpress', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        this.setState({
          tableList: data.list,
          pageTotal: data.total,
          pageSizeOptions: [`50`, `100`, `200`, `${data.total > 300 ? data.total : 300}`],
        });
      } else if (r.data.status < 10000) {
        this.setState({pageTotal: 0, tableList: []})
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 更改当前页或每页显示条数
  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize
    }, () => {
      this.queryIsEntrySpeedexpress();
    });
  }
  // 更换商店触发
  selectShop(currentShopId) {
    this.setState({currentShopId},() => {
      this.queryIsEntrySpeedexpress();
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const columns = [
      {title: `订单时间`, dataIndex: `createTime`, key: 'createTime', width: 160,
        render: text => <div>{text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''}</div>
      },
      {title: '药妆店名称', dataIndex: `shopId`, key: 'shopId', width: 200,
        render: text => <div>{shopObj[text]}</div>
      },
      {title: '客户昵称', dataIndex: 'nickname', key: 'nickname'},
      {title: '箱号', dataIndex: 'parcelCode', key: 'parcelCode', width: 160},
    ];
    const {tableList, pageNum, pageSize, pageTotal, pageSizeOptions, tableIsLoading, shopList, currentShopId, shopObj} = this.state;
    return (
      <div className="SKTListToBeEntered contentMain">
        <div className="title">
          <div className="titleMain">待录入列表</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <Select className="selectShop"
                  placeholder="请选择商店"
                  value={currentShopId}
                  dropdownMatchSelectWidth={false}
                  onChange={this.selectShop.bind(this)}
          >{shopList}</Select>
        </div>
        <div className="tableMain"
             style={{maxWidth: 800}}>
          {/*表单主体*/}
          <Table className="tableList"
                 ref={'commoditiesTable'}
                 dataSource={tableList}
                 columns={columns}
                 pagination={false}
                 bordered
                 scroll={{y: 550, x: 700}}
                 rowKey={(record, index) => `id_${index}`}
                 loading={tableIsLoading}
          />

          {/*分页*/}
          <Pagination className="tablePagination"
                      total={pageTotal}
                      pageSize={pageSize}
                      current={pageNum}
                      showTotal={(total, range) =>
                        `${range[1] === 0 ? '' : `当前为第 ${range[0]}-${range[1]} 条 `}共 ${total} 条记录`
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

export default SKTListToBeEntered;