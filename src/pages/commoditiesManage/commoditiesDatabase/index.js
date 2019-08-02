import React from 'react';
import {Radio, Table, Pagination, Button, Input, message, Modal, Icon,} from 'antd';
import XLSX from 'xlsx';
import moment from 'moment/';
import Country from '@js/countryForCD/';
import JsZip from 'jszip';
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class commoditiesDataBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 图片下载压缩相关
      // zip组件
      zip: new JsZip(),
      // 商品图片文件夹
      imageFolder: null,
      // 图片下载弹窗
      downloadImageVisible: false,
      // 弹窗加载状态
      imageLoading: false,
      // 图片成功列表
      imageSuccessList: [],
      // 图片失败列表
      imageFailList: [],
      // 图片是否已完成下载
      imageIsDownload: false,

      // 文件加载
      input: null,
      // 导入导出弹框显示
      importModalVisible: false,
      exportModalVisible: false,
      // 导入excel文件存储
      excelDataListOrigin: [],
      excelDataList: [],
      // excel错误列表
      errorList: [],
      // excel自增用序列号
      Num: 0,
      // 失败列表
      failList: [],
      failListNum: [],
      // 成功列表
      successList: [],

      // 表单数据
      dataList: [],
      // 搜索字段
      searchValue: '',
      // 搜索备案类型
      record: 0,
      // 分页状态
      pageNum: 1,
      pageSize: 100,
      pageTotal: 0,
      // 每页显示数据条数选择框
      pageSizeOptions: [`50`, `100`, `200`, `300`],
      // 表单加载中显示
      tableIsLoading: false,

      // 提交状态
      isSubmit: false,
      // 导出状态
      isExport: false,
    };
    // window.commoditiesDataBase = this;
  }
  allow = this.props.appStore.getAllow.bind(this);
  // 这里需要在组件即将加载时优先生成input
  componentWillMount() {
    const {zip} = this.state;
    // 创建导入用input
    let input = document.createElement(`input`);
    input.type = `file`;
    input.className = "inputImport";
    input.onchange = this.showModal.bind(this);
    this.setState({input: input,imageFolder: zip.folder('商品图片')});
  }

  // 默认读取表格
  componentDidMount() {
    // 默认载入表格数据
    const record = window.getQueryString('record');
    this.setState({record: record && (record !== 'null') ? parseInt(record) : 0},() => {
      this.getSku();
    });
  }

  // 确定下载/压缩图片
  downloadImages() {
    const { dataList, imageSuccessList, imageFailList, imageFolder, zip, } = this.state;
    this.setState({imageLoading: true,imageIsDownload: true});

    let picNum = 0;
    let addPicNum = () => {
      // console.log(imageFailList);
      picNum += 1;
      downloadPic();
    };
    let downloadPic = () => {
      if (picNum === dataList.length) {
        // 图片下载结束, 导出zip文件
        let fileName = `未备案商品图片${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.zip`;
        zip.generateAsync({type: "blob"}).then((file) => {
          window.saveAs(file, fileName);
          message.success('图片下载/压缩成功');
          this.setState({imageLoading: false});
        }).catch(r=>{
          console.error(r);
          message.error(`前端错误: 下载/压缩失败`);
        });
      } else {
        // 图片继续下载
        if (dataList[picNum].imgUrl === null) {
          // 该商品图片为空
          imageFailList.push({skuCode:dataList[picNum].skuCode,errorReason:'商品图片地址为空'});
          // console.log(dataList[picNum].skuCode,', 图片imgUrl为null');
          addPicNum();
        } else {
          // 该商品图片不为空
          if (dataList[picNum].imgUrl.includes('//recipt-picture.oss-cn-hongkong.aliyuncs.com/sku-img/')) {
            // 图片地址/文件夹吻合
            // 处理地址
            let url = `//${dataList[picNum].imgUrl.split('//')[1]}`;
            // 处理图片类型
            let typeList = dataList[picNum].imgUrl.split('.'),
              type = typeList[(typeList.length - 1)];

            // 使用fetch方法下载图片, 转存为 blob
            fetch(url).then(r => r.blob()).then(r => {
              // 获取图片文件成功
              imageFolder.file(`JD${dataList[picNum].skuCode}.${type}`, r);
              imageSuccessList.push(dataList[picNum]);
              // 下载单张图片成功时, 静默处理
              // console.log(dataList[picNum].skuCode,', 图片下载成功');
              //
              // 这里需要额外说明, 当商品图片为空或不符合格式而跳过时, 由本地判断的速度会非常快
              // 从而导致浏览器在短时间内超量调用渲染render方法, 导致卡顿, 甚至内存溢出过载
              // 所以仅在调取接口下载图片时, 重新渲染render
              // this.forceUpdate()也可以达成这个效果,
              // 但是出于安全考虑, 建议使用this.setState({})
              this.setState({});
              addPicNum();
            }).catch(()=>{
              // 代码出现解析问题, 或文件类型有误
              imageFailList.push({skuCode:dataList[picNum].skuCode,errorReason:'获取图片失败'});
              // console.log(dataList[picNum].skuCode,', 图片下载失败');
              addPicNum();
            })
          } else {
            // 图片地址/文件夹不吻合
            imageFailList.push({skuCode:dataList[picNum].skuCode,errorReason:'商品图片地址有误'});
            // console.log(dataList[picNum].skuCode,', 图片地址有误');
            addPicNum();
          }
        }
      }
    };
    downloadPic();
  }

  // 打开弹窗
  showModal(e) {
    const {input} = this.state;
    let item = e.target.files[0];
    // 格式校验
    if (item.type === `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
      || item.type === `application/vnd.ms-excel`) {
      let reader = new FileReader();
      // 定义reader的加载方法, 于加载完成后触发
      reader.onload = (e) => {
        let data = e.target.result, wb;
        wb = XLSX.read(data, {
          type: 'binary'
        });
        // 这里对list进行复制, 并且于此改写形式
        let excelDataListOrigin = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]), excelDataList = [],
          errorList = [];
        for (let i in excelDataListOrigin) {
          // i + 2 = 表单内行数号
          let codeChange = excelDataListOrigin[i].商品货号.split(`JD`)[1];
          const code = codeChange ? excelDataListOrigin[i].商品货号 : `JD${excelDataListOrigin[i].商品货号}`,
            // code = excelDataListOrigin[i].商品货号,
            price = excelDataListOrigin[i].成本价;
            // name = excelDataListOrigin[i].商品名称,
            // brand = excelDataListOrigin[i].品牌,
            // specificationType = excelDataListOrigin[i].商品规格,
            // netWeight = excelDataListOrigin[i].净重,
            // grossWeight = excelDataListOrigin[i].毛重,
            // purchaseArea = Country[excelDataListOrigin[i].原产国];
          if (!code || !price) {
            errorList.push({
              Num: parseInt(i),
              // errValue: `${!code ? `商品货号 ` : ``}${!name ? '商品名称 ' : ''}${!brand ? '品牌 ' : ''}${!netWeight ? '净重 ' : ''}${!grossWeight ? '毛重 ' : ''}${!purchaseArea ? '原产国 ' : ''}${!price ? `成本价` : ``}${!specificationType ? '商品规格' : ''}`,
              errValue: `${!code ? `商品货号 ` : ``}${!price ? `成本价` : ``}`,
            })
          } else {
            excelDataList.push({
              skuCode: code,
              recordPrice: price,
              Num: parseInt(i),
              // name: name,
              // brand: brand,
              // netWeight: netWeight,
              // grossWeight: grossWeight,
              // purchaseArea: purchaseArea,
              // specificationType: specificationType
            });
          }
        }
        console.log(`这里显示表单内源数据: `);
        console.log(excelDataListOrigin);
        console.log(`这里显示处理后数据: `);
        console.log(excelDataList);
        this.setState({
          importModalVisible: true,
          excelDataListOrigin: excelDataListOrigin,
          excelDataList: excelDataList,
          errorList: errorList,
        })
      };
      // 执行reader进行加载
      reader.readAsBinaryString(e.target.files[0]);
    } else {
      message.warn(`所选文件格式不正确`);
      this.setState({importModalVisible: false}, () => {
        input.value = null;
      })
    }
  }

  // 寻找 input 进行点击
  clickIT() {
    const {input,} = this.state;
    input.click();
  }

  // 获取表单列表
  getSku() {
    const { pageNum, pageSize, searchValue, record } = this.state;
    this.setState({tableIsLoading: true});
    let dataObj = {
      choice: record,
      pageNum: pageNum,
      pageSize: pageSize,
      searchParm: searchValue.trim()
    };
    this.ajax.post('/sku/getSku',dataObj).then(r => {
      const { data, status } = r.data;
      let dataObj = {};
      if (status === 10000) {
        dataObj = {
          dataList: data.list,
          pageNum: data.pageNum,
          pageSize: data.pageSize,
          pageTotal: data.total,
          pageSizeOptions: [`50`, `100`, `200`, `${data.total > 300 ? data.total : 300}`]
        };
      } else if (status < 10000) {
        dataObj = {
          dataList: [],
          pageNum: 1,
          pageTotal: 0,
          pageSizeOptions: [`50`, `100`, `200`, `300`]
        };
      }
      this.setState(dataObj);
      r.showError();
      this.setState({tableIsLoading: false});
    }).catch(r => {
      this.setState({tableIsLoading: false});
      this.ajax.isReturnLogin(r,this);
    });
  }

  // 导出备案excel
  exportExcel_record_1() {
    let elt = document.getElementById('tableList_record_1');
    let wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
    XLSX.writeFile(wb, `商品资料库 (美渠) ${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.xlsx`);
  }

  // 导出未备案excel
  exportExcel() {
    const {record, dataList,} = this.state;
    let elt = document.getElementById('tableList');
    let wb = XLSX.utils.table_to_book(elt, {raw: true, sheet: "Sheet JS"});
    XLSX.writeFile(wb, (record === 3 ? `商品资料库备案表 ${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.xlsx` : `商品资料库 ${moment(new Date()).format('YYYY-MM-DD_HH.mm.ss')}.xlsx`));
    // 导出的同时调取接口,将相应的商品状态改为备案中
    let dataArray = [], dataArrayAll = [];
    for (let i of dataList) {
      dataArray.push(i.skuCode);
      dataArrayAll.push({
        skuId: i.skuId, name: i.name, recordPrice: i.recordPrice,
        // skuCode: i.skuCode,
        skuCode: `${i.skuCode}`,
        specificationType: i.specificationType, brand: i.brand, netWeight: i.netWeight, grossWeight: i.grossWeight
      })
    }
    // loading
    this.setState({isExport: true});
    this.ajax.post('/sku/sendExcel',dataArrayAll).then(r => {
      if (r.data.status === 10000) {
        this.ajax.post('/sku/updateProductRecordState',dataArray).then(r => {
          if (r.data.status === 1000) {
            message.success(`${r.msg}`);
            this.setState({exportModalVisible: false})
          }
          this.setState({isExport: false}, () => {
            this.getSku();
          });
          r.showError();
        }).catch(r => {
          this.ajax.isReturnLogin(r,this);
        })
      }
      r.showError();
    }).catch(r => {
      this.ajax.isReturnLogin(r,this);
    });
  }

  // 判断行邮方式
  postWay(q) {
    let way;
    switch (q) {
      case 0:
        way = '无';
        break;
      case 1:
        way = 'ETK';
        break;
      case 2:
        way = 'BC';
        break;
      default :
        way = '数据错误'
    }
    return way;
  }

  // 更改是否已备案条件触发
  changeRecord(e) {
    const {origin, pathname} = window.location;
    window.history.replaceState('','',`${origin}${pathname}?record=${e.target.value}`);
    this.setState({
      record: e.target.value,
      pageNum: 1,
      pageSize: 100,
    }, () => {
      this.getSku()
    })
  }

  // 调取根据skuId修改备案价以及备案状态接口
  updateSkuByUploadExcel() {
    const {Num, excelDataList, successList, failList, failListNum,} = this.state;
    if (Num < excelDataList.length) {
      this.setState({isSubmit: true});
      const dataObj = {
        skuCode: excelDataList[Num].skuCode.split(`JD`)[1],
        recordPrice: excelDataList[Num].recordPrice,
        isRecord: 1,
        brand: excelDataList[Num].brand,
        name: excelDataList[Num].name,
        netWeight: excelDataList[Num].netWeight,
        grossWeight: excelDataList[Num].grossWeight,
        purchaseArea: excelDataList[Num].purchaseArea,
        specificationType: excelDataList[Num].specificationType
      };
      this.ajax.post('/sku/updateSkuByUploadExcel', dataObj).then(r => {
        const {status, msg} = r.data;
        if (status === 10000) {
          successList.push(excelDataList[Num]);
          this.setState({Num: (Num + 1), successList: successList,}, () => {
            this.updateSkuByUploadExcel();
          })
        } else {
          // 非同源策略
          let dataObj = Object.assign({}, excelDataList[Num]);
          dataObj.msg = msg;
          dataObj.status = status;
          failList.push(dataObj);
          failListNum.push(dataObj.Num + 2);
          this.setState({Num: (Num + 1), failList: failList, failListNum: failListNum,}, () => {
            this.updateSkuByUploadExcel();
          })
        }
        r.showError();
      }).catch(r => {
        this.ajax.isReturnLogin(r,this);
      });
    } else {
      message.success(`导入结束, 如需继续, 请重新选择excel文件`);
      this.setState({ isSubmit: false}, () => {
        this.getSku();
      });
    }
  }

  // 更改当前页或每页显示条数
  changePage(pageNum, pageSize) {
    this.setState({
      pageNum: pageNum,
      pageSize: pageSize
    }, () => {
      this.getSku()
    });
  }

  // 跳转至编辑界面
  toCE(type, skuId) {
    const { record } = this.state;
    // 使用query传值
    // 在这里清空本地相关数据, 使得编辑和新增功能不受干扰
    localStorage.removeItem('imgList');
    localStorage.removeItem('newImgList');
    this.props.history.push(`/commodities-manage/commodities-database/create-and-edit?type=${type}&skuId=${skuId}&record=${record}`);
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const RadioButton = Radio.Button, RadioGroup = Radio.Group;
    const { dataList, searchValue, pageNum, pageSize, pageTotal, pageSizeOptions, record, importModalVisible, input, errorList, isSubmit, failList, failListNum, excelDataList, successList, tableIsLoading, exportModalVisible, isExport, downloadImageVisible, imageLoading, imageFailList, imageSuccessList, imageIsDownload, } = this.state;
    const Search = Input.Search;
    // 表单头
    const columns = [
      {
        title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160,
        render: (text, record) => (
          <div>{!!record.updateTime ? moment(record.updateTime).format('YYYY-MM-DD HH:mm:ss') : moment(record.createTime).format('YYYY-MM-DD HH:mm:ss')}</div>
        )
      },
      {title: '商品名称', dataIndex: 'name', key: 'name', width: 160},
      {title: '商品条码', dataIndex: 'skuCode', key: 'skuCode', width: 160},
      {
        title: '备案价', dataIndex: 'recordPrice', key: 'recordPrice', width: 120,
        render: (text, record) => (
          // 这里调用方法判断行邮方式
          <div>{record.recordPrice ? record.recordPrice : '无'}</div>
        ),
      },
      {
        title: '行邮方式', dataIndex: 'sugPostway', key: 'sugPostway', width: 100,
        render: (text, record) => (
          // 这里调用方法判断行邮方式
          <div>{this.postWay(record.sugPostway)}</div>
        ),
      },
      {title: '商品品牌', dataIndex: 'brand', key: 'brand'},
      {title: '毛重(kg)', dataIndex: 'grossWeight', key: 'grossWeight', width: 90},
      {title: '采购价', dataIndex: 'costPrice', key: 'costPrice', width: 120},
      // {title: '商品品类', dataIndex: 'category', key: 'category', width: 140},
      {title: '数量', dataIndex: 'stock', key: 'stock', width: 80},
      {
        title: '税率', dataIndex: 'taxRate', key: 'taxRate', width: 80,
        render: (text, record) => (
          // 这里调用方法判断行邮方式
          <div>{record.taxRate ? `${record.taxRate}%` : '无'}</div>
        ),
      }
    ];
    if (this.allow(60)) columns.push({
      title: '操作', dataIndex: '操作', key: '操作',
      width: 100,
      fixed: 'right',
      render: (text, record) => (
        <div>
          <Button type="primary"
                  style={{'margin': 0}}
                  onClick={this.toCE.bind(this,'edit', record.skuId)}
          >编辑</Button>
        </div>
      ),
    });
    const columnsForExport = [
      // 非必填字段于表中隐藏, 不对应实际dataIndex, 只填写必须部分
      // {title: `商家编码`, dataIndex: `商家编码`, key: `商家编码`, width: 80},
      // 商家编码暂存skuId
      {title: `商家编码`, dataIndex: `商家编码`, key: `商家编码`, width: 80},
      {title: `商品名称`, dataIndex: `name`, key: `name`, width: 80},
      // 即备案价, 返回以后用于导入, 覆盖原有备案价
      {title: `成本价`, dataIndex: `recordPrice`, key: `recordPrice`, width: 80},
      {title: `服务费`, dataIndex: `服务费`, key: `服务费`, width: 50},
      {title: `税率`, dataIndex: `税率`, key: `税率`, width: 80},
      {title: `库存地`, dataIndex: `库存地`, key: `库存地`, width: 50},
      {title: `商品货号`, dataIndex: `skuCode`, key: `skuCode`, width: 50},
      {title: `HS编码`, dataIndex: `HS编码`, key: `HS编码`, width: 50},
      {title: `计量单位`, dataIndex: `计量单位`, key: `计量单位`, width: 80},
      {title: `法定单位`, dataIndex: `法定单位`, key: `法定单位`, width: 50},
      {title: `第二单位`, dataIndex: `第二单位`, key: `第二单位`, width: 50},
      {title: `商品规格`, dataIndex: `specificationType`, key: `specificationType`, width: 80},
      {title: `品牌`, dataIndex: `brand`, key: `brand`, width: 80},
      {title: `行邮税号`, dataIndex: `行邮税号`, key: `行邮税号`, width: 80},
      {title: `行邮税名称`, dataIndex: `行邮税名称`, key: `行邮税名称`, width: 80},
      {title: `净重`, dataIndex: `netWeight`, key: `netWeight`, width: 80},
      {title: `毛重`, dataIndex: `grossWeight`, key: `grossWeight`, width: 80},
      {title: `原产国`, dataIndex: `purchaseArea`, key: `purchaseArea`, width: 80,
        render: (text, record) => (
          // 这里调用方法判断行邮方式
          <div>{
            record.purchaseArea ? (()=>{
              let code = null;
              for (let n in Country) {
                if (Country[n] === record.purchaseArea) code = n;
              }
              return code;
            })() : ''
          }</div>
        ),
      },
      {title: `生产厂家`, dataIndex: `brand`, key: `brandOrigin`, width: 80},
      {title: `商检备案号`, dataIndex: `商检备案号`, key: `商检备案号`, width: 50},
      {title: `这行不能修改任何名称`, dataIndex: `这行不能修改任何名称`, key: `这行不能修改任何名称`},
      // 暂不显示skuId
      // {title: `这一列请勿修改任何数据`, dataIndex: `skuId`, key: `skuId`, width: 80},
    ];
    return (
      <div className="dataBase contentMain">
        <div className="title">
          <div className="titleMain">商品资料库</div>
          <div className="titleLine" />
        </div>

        {/*导出弹窗*/}
        <Modal title="导出"
               className="exportModal"
               visible={exportModalVisible}
               onOk={this.exportExcel.bind(this)}
               confirmLoading={!!isExport}
               onCancel={() => {
                 isExport ?
                   message.warn(`数据备案中,请勿关闭`)
                   : this.setState({exportModalVisible: false})
               }}
        >
          <p>确认是否导出该页全部商品excel文件, 并将他们移至至备案中</p>
          <p style={{color: `red`, opacity: .8}}>请将导出的excel文件妥善保存</p>
        </Modal>

        {/*导入弹窗*/}
        <Modal title="导入"
               className="importModal"
               visible={importModalVisible}
               confirmLoading={!!isSubmit}
               onOk={this.updateSkuByUploadExcel.bind(this)}
               onCancel={
                 () => {
                   isSubmit ?
                     message.warn(`文件导入中,请勿关闭`)
                     : this.setState({
                       // 复位数据
                       importModalVisible: false,
                       excelDataListOrigin: [],
                       excelDataList: [],
                       errorList: [],
                       Num: 0,
                       failList: [],
                       failListNum: [],
                       successList: [],
                     }, () => {
                       input.value = null;
                     })
                 }
               }
        >
          <p>所选文件名: {!!input.value ? input.files[0].name : null}</p>
          <p style={{color: `red`, fontSize: '24px'}}>注意, 当前版本只导入备案价格!</p>
          {isSubmit ? <p><Icon type="loading"/> <span style={{color: `red`}}>正在上传数据中... 请勿关闭页面!!!</span></p> : null}
          <p>{`当前上传条数 ${successList.length}/${excelDataList.length}, 成功${successList.length}条, 失败${failList.length}条`}</p>
          <p style={{color: `red`}}>请注意备份本页报错数据, 并根据报错提示检查备案表内数据</p>
          <div className="failList">
            <p>{`excel表内出错数据行数: ${failListNum}`}</p>
            {failList.map((item, i) => (
              <p key={i}>{parseInt(item.status) < 10000 ?
                (`excel表内警告数据行数: ${item.Num + 2}, 警告原因: ${item.msg}, 状态码: ${item.status}`)
                : (`excel表内出错数据行数: ${item.Num + 2}, 出错原因: ${item.msg}, 状态码: ${item.status}`)
              }</p>
            ))}
          </div>
          {errorList.length > 0 ? <p>当前excel表格存在数据漏填, 如继续导入, 以下行数数据则不会进行处理</p> : ``}
          <div className="errorList">
            {errorList.map((item, i) => (
              <p key={i}>{`excel表内出错数据行数: ${item.Num + 2}, 出错数据值: ${item.errValue}`}</p>
            ))}
          </div>
        </Modal>

        {/*下载图片弹窗*/}
        <Modal title="下载图片"
               wrapClassName="downloadAndZipFilesModal"
               visible={downloadImageVisible}
               confirmLoading={imageLoading}
               onOk={()=>{imageIsDownload ? message.error('图片已下载完成, 如需重新下载需关闭窗口重新打开')
                 : this.downloadImages()
               }}
               width={600}
               onCancel={()=>{
                 if (imageLoading) {
                   message.error('正在下载中,请勿关闭')
                 } else {
                   this.setState({
                     downloadImageVisible: false,
                     imageIsDownload: false,
                     imageFailList: [],
                     imageSuccessList: []
                   });
                   this.getSku()
                 }
               }}
        >
          {imageLoading &&
          <p style={{fontSize:'24px',color:'rgba(255,0,0,.7)'}}>
            <Icon type="loading" /> 正在下载图片, 请稍后...
          </p>
          }
          <p>当前处理完成图片: {imageFailList.length + imageSuccessList.length}/{dataList.length}</p>
          <p>当前错误图片:</p>
          {imageFailList.map((item,i) => (
            <p style={{color:'rgba(255,0,0,.7)'}} key={i}>{i}. 商品码:{item.skuCode}, 下载失败原因:{item.errorReason}</p>
          ))}
        </Modal>

        <div className="btnLine">
          {/*查询条件单选行*/}
          <RadioGroup value={record}
                      buttonStyle="solid"
                      onChange={this.changeRecord.bind(this)}
          >
            <RadioButton value={0}>全部</RadioButton>
            <RadioButton value={1}>已备案</RadioButton>
            <RadioButton value={2}>待导出备案(未备案)</RadioButton>
            <RadioButton value={3}>备案中</RadioButton>
            <RadioButton value={5}>临时已备案</RadioButton>
            <RadioButton value={4}>作废</RadioButton>
          </RadioGroup>
        </div>

        {/*新增按钮 excel导出 搜索框*/}
        <div className="btnLine">
          {this.allow(60) && <Button type="primary"
                                     className="createNew"
                                     onClick={this.toCE.bind(this,'create', null)}
          >新增商品</Button>}
          {record === 1 && <Button type="primary"
                                   className="exportExcelBtn"
                                   onClick={this.exportExcel_record_1.bind(this)}
          >导出已备案资料</Button>}
          {this.allow(56) && (record === 2 ||  record === 5) && <Button type="primary"
                                                     className="exportExcelBtn"
                                                     onClick={() => this.setState({exportModalVisible: true})}
          >excel导出</Button>}
          {this.allow(56) && (record === 2 ||  record === 5) && <Button type="primary"
                                                     className="importExcelBtn"
                                                     onClick={()=>this.setState({downloadImageVisible: true})}
          >下载图片</Button>}
          {this.allow(58) && record === 3 &&
          <Button type="primary"
                  onClick={this.clickIT.bind(this)}
                  className="importExcelBtn"
          >excel导入更新备案价</Button>
          }
          <Search className="searchInput"
                  placeholder="请输入关键字进行搜索"
                  value={searchValue}
            // 根据条件搜索
                  onSearch={(e) => this.getSku(e)}
            // 保存搜索框值
                  onChange={(e) => this.setState({searchValue: e.target.value})}
          />
        </div>

        <div className="tableMain">
          {/*表单主体*/}
          <Table className="tableList"
                 ref={'commoditiesTable'}
                 dataSource={dataList}
            // columns={record === 2 ? columnsForExport : columns}
                 columns={columns}
                 pagination={false}
                 bordered
                 scroll={{y: 500, x: 1300}}
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

        {/*导出用表单*/}
        {(record === 2 || record === 5) && <Table className="tableListForExport"
                                id="tableList"
                                columns={columnsForExport}
                                dataSource={dataList}
                                pagination={false}
                                style={{display: 'none'}}
                                rowKey={(record, index) => `id_${index}`}
        />}

        {/*已备案导出用表单, 美渠推单用*/}
        {record === 1 && <Table className="tableListForExport_20190312"
                                id="tableList_record_1"
                                columns={[
                                  {title: `商品条形码`, dataIndex: `skuCode`, key: `skuCode`},
                                  {title: `商品名称`, dataIndex: `name`, key: `name`},
                                  {title: `备案价`, dataIndex: `recordPrice`, key: `recordPrice`, width: 80},
                                  {title: `净重(kg)`, dataIndex: `netWeight`, key: `netWeight`},
                                  {title: `毛重(kg)`, dataIndex: `grossWeight`, key: `grossWeight`},
                                  {title: `商品品牌`, dataIndex: `brand`, key: `brand`},
                                  {title: `规格型号`, dataIndex: `specificationType`, key: `specificationType`},
                                  {title: `单位`, dataIndex: `modelNumber`, key: `modelNumber`},
                                  {title: `数量/库存`, dataIndex: `stock`, key: `stock`},
                                  {title: `税率(%)`, dataIndex: `taxRate`, key: `taxRate`},
                                  {title: `采购地`, dataIndex: `purchaseArea`, key: `purchaseArea`},
                                  {title: `海关编码`, dataIndex: `customsCode`, key: `customsCode`},
                                  {
                                    title: `建议行邮方式`, dataIndex: `sugPostway`, key: `sugPostway`,
                                    render: (text, record) => (
                                      // 这里判断行邮方式
                                      <div>{record.sugPostway === 1 ? `ETK` : (record.sugPostway === 2 ? `BC` : `无`)}</div>
                                    ),
                                  },
                                  {title: `品类`, dataIndex: `category`, key: `category`},
                                  {title: `行邮税号`, dataIndex: `postcode`, key: `postcode`},
                                ]}
                                dataSource={dataList}
                                pagination={false}
                                style={{display: 'none'}}
                                rowKey={(record, index) => `id_${index}`}
        />}
      </div>
    )
  }
}

export default commoditiesDataBase;