import React from 'react';
import { Button, message, Icon, } from 'antd';
import XLSX from 'xlsx';
// xlsx转blob
import '@js/FileSaver.min.js';
import './index.less';

import Country from "@js/countryForCD";

class importExcel extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      input: null,
      dataList: [],
      processedDataList: [],
      categoryList: [],
      successList: [],
      failList: [],
      repeatList: [],
      failListNum: [],
      failListReason: [],
      repeatListNum: [],
      Num: 0,
      isStart: false,
      inputUrl: '',
      token: '',
      // url: 'http://47.98.221.129:8088/quanhai',
      // url: 'http://127.0.0.1:8088/quanhai',
      url: 'http://192.168.31.60:8088',
    };
    window.importExcel = this;
  }

  componentDidMount() {
    let input = document.createElement(`input`);
    input.type = `file`;
    input.className = "inputImport";
    input.onchange = this.importExcel.bind(this);
    this.setState({input: input});

    // 用于接取品类关联数据校验行邮税号
    fetch(`${window.fandianUrl}/sku/getAllProductCategory`, {
      method: 'POST'
    }).then(r => r.json()).then(r => {
      // console.log(r)
      this.setState({
        categoryList: r.data
      })
    });
  }
  test2() {
    let data = {pageNum: 1,pageSize: 3};
    this.ajax.post('/role/getRoleList', data).then(r => {
      console.log(r);
      // 使用 showError 方法, 进行统一报错
      r.showError();
    }).catch(r => {
      message.error('前端接口调取/数据处理出现错误, 请联系管理员');
    })
  }
  test3() {
    let data = {roleName: '销售', menuIdList: [ 2, 3, 4 ]};
    this.ajax.post('/role/addRole', data).then(r => {
      console.log(r);
      // 使用 showError 方法, 进行统一报错
      r.showError();
    }).catch(r => {
      message.error('前端接口调取/数据处理出现错误, 请联系管理员');
    })
  }

  // 导出excel方法
  exportExcel () {
    let elt = document.getElementById('tableList');
    let wb = XLSX.utils.table_to_book(elt, {sheet:"Sheet JS"});

    // 转为下载文件
    XLSX.writeFile(wb, `test.xlsx`);

    // 转为blob
    // 不会阻止文件下载行为
    let blob = XLSX.write(wb,{ bookSST:false, type:'base64' });
    window.saveAs(new Blob([blob],{type:"application/octet-stream"}), "test.xlsx");
  }
  // 导入
  importExcel(e){
    // console.log(e.target.files[0]);
    let item = e.target.files[0];
    // 判断文件类型为 .xlsx 或 .xls
    if (!!item) {
      if (item.type === `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        || item.type === `application/vnd.ms-excel`) {
        let reader = new FileReader();
        reader.onload = (e) => {
          let data = e.target.result,wb;
          wb = XLSX.read(data, {
            type: 'binary'
          });
          // json
          // console.log(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));

          this.setState({
            dataList: XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]),
          },() => {
            this.beforeUploadSku()
          })
        };
        reader.readAsBinaryString(e.target.files[0]);
        // 改写标签内容, 将文件名写入
        document.getElementsByClassName(`filesName`)[0].innerHTML = e.target.files[0].name;
      } else {
        message.error(`文件类型错误`);
        e.target.value = ``
      }
    }
  }
  // 导入至商品库
  beforeUploadSku() {
    const { dataList, categoryList, } = this.state;
    // console.log(dataList);
    let list = [],difObj = {};
    for (let v of categoryList) {
      difObj[v.name] = v.taxNumber
    }
    for (let i in dataList) {
      let dataObj = {
        brand: dataList[i].品牌,
        // category: null,
        costPrice: null,
        costType: 0,
        customsCode: null,
        imgList: [],
        // 本次导入为全部已备案
        isRecord: 1,
        modelNumber: dataList[i].商品规格.split('/')[1],
        name: dataList[i].商品名称,
        netWeight: dataList[i].净重,
        originalPrice: null,
        originalType: 0,
        // postcode: null,
        purchaseArea: Country[dataList[i].原产国],
        recordPrice: dataList[i].成本价,
        skuCode: dataList[i].商品货号.split('JD')[1],
        specificationType: dataList[i].商品规格,
        stock: null,
        // 本次导入建议行邮方式全部为2(BC)
        sugPostway: 2,
        // sugPrice: null,
        taxRate: null
      };
      list.push(dataObj)
    }
    // console.log(list);
    this.setState({processedDataList: list})
  }
  // 上传
  uploadSku() {
    this.setState({isStart: true});
    this.createNewSku();
  }
  // 新增sku接口
  createNewSku() {
    const { Num, processedDataList, failList, repeatList, successList, failListNum, repeatListNum, failListReason, } = this.state;
    if (!!processedDataList[Num]) {
      fetch(`${window.fandianUrl}/sku/uploadSku`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(processedDataList[Num])
      }).then(r => r.json()).then(r => {
        if (!r.status) {
          message.error(`后端数据错误`)
        } else {
          if (r.status === 10000) {
            // 新增成功
            let dataList = successList;
            dataList.push(processedDataList[Num]);
            this.setState({successList: dataList, Num: (Num + 1)},(the = this) => {
              the.createNewSku()
            })
          } else {
            message.error(`${r.msg} 错误码: ${r.status}`);
            if (r.status === 10006) {
              // 商品码重复
              let dataList = repeatList;
              dataList.push(processedDataList[Num]);
              // 表单第一行为标题, 表单第二行为数据第一行, 该行Num为0
              repeatListNum.push(Num+2);
              this.setState({repeatList: dataList, Num: (Num + 1), repeatListNum: repeatListNum},(the = this) => {
                the.createNewSku()
              })
            } else {
              // 上传失败
              let dataList = failList;
              processedDataList[Num].msg = r.msg;
              processedDataList[Num].status = r.status;
              // 表单第一行为标题, 表单第二行为数据第一行, 该行Num为0
              failListNum.push(Num+2);
              failListReason.push({Num: Num, msg: r.msg, status: r.status});
              dataList.push(processedDataList[Num]);
              this.setState({
                failList: dataList, Num: (Num + 1),
                failListNum: failListNum,
                failListReason: failListReason
              },(the = this) => {
                the.createNewSku()
              })
            }
          }
        }
      }).catch(() => {
        message.error(`新增商品资料接口调取失败`)
      })
    } else {
      this.setState({isStart: false});
      console.log(`-------------------- 分割线 --------------------`);
      console.log(`成功列表: `);
      console.log(successList);
      console.log(`-------------------- 分割线 --------------------`);
      console.log(`失败列表: `);
      console.log(failList);
      console.log(`-------------------- 分割线 --------------------`);
      console.log(`重复列表: `);
      console.log(repeatList);
      console.log(`-------------------- 分割线 --------------------`);
      console.log(`如果需要重新上传, 建议备份上述列表资料, 然后刷新页面重新发送`);
      console.log(`这里代码层不做列表清除处理`);
      console.log(`-------------------- 分割线 --------------------`);
    }
  }
  // 寻找 input 进行点击
  clickIIT() {
    const { input, } = this.state;
    input.click();
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { processedDataList, Num, successList, failList, repeatList, failListNum, repeatListNum, isStart, failListReason, } = this.state;
    return (
      <div className="importExcel contentMain">
        <div className="title">
          <div className="titleMain">导入excel</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <p className="pTitle">- 这里导入excel文件</p>
          <Button onClick={this.clickIIT.bind(this)}
                  type="primary"
                  style={{marginLeft: 10}}
          >点击导入</Button>
          <p className="filesName" />
        </div>
        <div className="btnLine">
          <p className="pTitle">- 这里上传excel文件内容至各数据库</p>
          <Button type="primary"
                  style={{marginLeft: 10}}
                  onClick={this.uploadSku.bind(this)}
          >上传至商品库</Button>
          {isStart && <p style={{marginTop: 4}}>{Num === processedDataList.length ? `数据加载完毕` : <span><Icon type="loading" /> 加载中...</span>}</p>}
          <p style={{marginTop: 4,wordWrap:`break-word`}}>{`已完成${Num}/${processedDataList.length}条数据`}</p>
          <p style={{marginTop: 4,wordWrap:`break-word`}}>{`成功${successList.length}条, 失败${failList.length}条, 重复提交${repeatList.length}条`}</p>
          <p style={{marginTop: 4,wordWrap:`break-word`}}>{`失败数据表单内序号: ${failListNum}`}</p>
          <p style={{marginTop: 4,wordWrap:`break-word`}}>{`重复数据表单内序号: ${repeatListNum}`}</p>
          <div style={{marginTop: 4,wordWrap:`break-word`}}>
            {failListReason.map((item,i) => (
              <p key={i}>{`出错数据行数: ${item.Num+2}, 出错数据原因: ${item.msg}, 出错数据错误码: ${item.status}`}</p>
            ))}
          </div>
        </div>
        <div className="btnLine">
          <Button type="primary"
                  onClick={this.test2.bind(this)}
                  style={{marginLeft: 10}}
          >测试调取接口2</Button>
        </div>
        <div className="btnLine">
          <Button type="primary"
                  onClick={this.test3.bind(this)}
                  style={{marginLeft: 10}}
          >测试调取接口3</Button>
        </div>
      </div>
    )
  }
}

export default importExcel;