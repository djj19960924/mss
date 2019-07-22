import React from 'react';
import { InputNumber, Select, Button, message, } from 'antd';
import './index.less';

const Option = Select.Option;

class MoneyCalculation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      brandList: [],
      defaultBrand: ``,
      defaultBrandRebate: null,
      number: null,
      mainDataList: [],
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 注意, 在 componentDidUpdate 中, 如未进行条件判断直接进行 setState ,会造成死循环
    // 这里通过该生命周期拦截父组件渲染动作, 以获取实时数据
    const { ticketDate, brandListOrigin, hasChange, } = this.props;
    const { mainDataList, } = this.state;
    //
    // 这里注意! 由于逻辑改变, 导致变更日期是列表一定会改变, 并且列表不固定
    // 所以这里将注释掉, 并且不影响现有功能
    //
    // 当日期改变后触发
    // if (prevProps.ticketDate !== ticketDate) {
    //   for (let n in mainDataList) {
    //     this.getRebateRate(mainDataList[n].brand,n)
    //   }
    // }
    // 当 mainDataList 改变时触发
    if (prevState.mainDataList !== mainDataList) {
      // 这里需要侦测是否改变了品牌, 由此来更新该品牌该日期返点率
      for (let n in mainDataList) {
        if (!!prevState.mainDataList.length > 0) {
          if (prevState.mainDataList[n].brand !== mainDataList[n].brand) {
            this.getRebateRate(mainDataList[n].brand,n)
          }
        }
      }
    }
    // 当品牌列表改变后触发
    // 强制清空已选择的品牌(!暂时强制清空, 不良操作造成数据混乱)
    if (prevProps.brandListOrigin !== brandListOrigin) {
      // console.log(prevProps.brandListOrigin);
      // console.log(brandListOrigin);
      if (brandListOrigin.length > 0) {
        let dataList = [];
        let n = 0;
        for (let i of brandListOrigin) {
          // 这里的value会作为选择框的搜索字段, 所以需求同时可以根据Id或者Name查询, 则在value值中同时插入Id和Name
          // 但是注意最终传值时不要取value
          // console.log(n);
          dataList.push(<Option name={i.brandName} key={n}
                                style={{textAlign: `center`}} title={i.brandName}
                                value={i.brandId + i.brandName}>{i.brandName}</Option>);
          n++;
        }
        this.getRebateRate(brandListOrigin[0].brandName, `default`);
        this.setState({
          brandList: dataList,
          // 这里默认选取第一个品牌
          defaultBrand: brandListOrigin[0].brandName,
          mainDataList: [{brand: brandListOrigin[0].brandName}]
        });
        this.props.changeReciptMoney([{brand: brandListOrigin[0].brandName}])
      } else {
        this.setState({mainDataList: []})
      }
    }
    // 当小票提交或驳回成功以后触发
    // if (prevProps.hasChange !== hasChange) {
    //   this.props.changeReciptMoney([{brand: brandListOrigin[0].brandName}]);
    //   this.setState({
    //     mainDataList: [{brand: brandListOrigin[0].brandName}],
    //   },() => {this.getRebateRate(mainDataList[0].brand,0)})
    // }
  }

  // 币种判断
  currencyType(c) {
    let type;
    switch (c) {
      case `韩国`: type = `美元`; break;
      case `日本`: type = `日元`; break;
      case `法国`: type = `欧元`; break;
      default : type = `人民币`
    }
    return `消费金额(${type})`;
  }

  // 获取当日返点率
  getRebateRate(name, No) {
    const {ticketDate, currentShop} = this.props;
    const data = {
      mallName: currentShop,
      brandName: name,
      rebateDate: ticketDate,
    };
    this.ajax.post('/rebate/getRebateByDate', data).then(r => {
      if (r.data.status === 10000) {
        const {data} = r.data;
        const {mainDataList} = this.state;
        if (No === `default`) this.setState({defaultBrandRebate: data.rebateRate});
        mainDataList[(No === `default` ? '0' : No)].brandRebate = data.rebateRate;
        // 当获取新的返点率以后, 实时改变返点率最后的计算值
        this.setState({},() => {
          this.props.changeReciptMoney(mainDataList)
        })
      }
      r.showError();
    }).catch(r => {
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { brandList, mainDataList, defaultBrand, defaultBrandRebate, } = this.state;
    const { country, changeReciptMoney, repeatList, emptyList, } = this.props;
    return (
      <div className="moneyCalculation">
        <div className="title">
          <ul>
            <li style={{width: 160}}>品牌</li>
            <li style={{width: 90,marginLeft: 10}}>返点率</li>
            <li style={{width: 130,marginLeft: 26}}>{this.currencyType(country)}</li>
          </ul>
        </div>
        <div className="main">
          {mainDataList.length === 0 &&
            <div className="noMall">请先选择商场</div>
          }
          {mainDataList.map( (item,i) => (
            <div className={`brandLine line_${i}`} key={`id_${i}`}>
              <Select style={{width: 160, testAlign: `center`}}
                      className={ repeatList.includes(String(i)) ? 'selectBrand' : ''}
                      value={mainDataList[i].brand}
                      title={mainDataList[i].brand}
                      showSearch
                      dropdownMatchSelectWidth={false}
                      onChange={(value,target) => {
                        // 这里需要数组赋值并且不改变原数组值, 然而要修改的原数组值为对象
                        // 其中数组内的对象如直接等于原对象, 则值的内存地址也完全相同
                        // 当改变新对象的同时, 之前的对象值由于同源, 也会受到影响
                        // 数组可以使用 let a = [], b = a.concat() 回避同源
                        // 对象可以使用 let a = {}, b = Object.assign({},a) 回避同源
                        let dataList =  [];
                        for (let v of mainDataList) {
                          let dataObj = Object.assign({},v);
                          dataList.push(dataObj)
                        }
                        dataList[i].brand = target.props.name;
                        // 清除报错
                        let d = document.querySelector(`.brandLine.line_${i}`).querySelector('.selectBrand,.ant-select-focused').querySelector('.ant-select-selection');
                        d.style.border = '';
                        this.setState({mainDataList: dataList},(mainDataList = mainDataList) => {
                          changeReciptMoney(mainDataList);
                        });
                      }}
              >
                {brandList}
              </Select>
              <InputNumber style={{width: 90, marginLeft: 10}}
                           value={mainDataList[i].brandRebate}
                           min={0}
                           max={99.9}
                           precision={1}
                           onChange={ (e) => {
                             mainDataList[i].brandRebate = e;
                             this.setState({mainDataList: mainDataList},(mainDataList = mainDataList) => {
                               changeReciptMoney(mainDataList);
                             })
                           }}
              /><span> %</span>
              <InputNumber style={{width: 130, marginLeft: 10}}
                           defaultValue={''}
                           min={0}
                           max={999999.99}
                           precision={2}
                           placeholder="请输入消费金额"
                           className={ !emptyList.includes(String(i)) ? 'noHandlerWrap' : 'noHandlerWrap hasError' }
                           // className="noHandlerWrap"
                           focus={()=>console.log(`获取焦点`)}
                           value={mainDataList[i].totalMoney}
                           onChange={ (e) => {
                             mainDataList[i].totalMoney = e;
                             this.setState({mainDataList: mainDataList},(mainDataList = mainDataList) => {
                               changeReciptMoney(mainDataList);
                             })
                           }}
              />
              {country === `法国` && <Button type="danger"
                      style={{marginLeft: 10, opacity: (mainDataList.length === 1 ? 0.5 : 1)}}
                      disabled={mainDataList.length === 1}
                      onClick={ () => {
                        mainDataList.splice(i,1);
                        this.setState({mainDataList: mainDataList},(mainDataList = mainDataList) => {
                          changeReciptMoney(mainDataList);
                        })
                      }}
              >删除该条</Button>}
            </div>
          ))}
          {/*添加一条*/}
          {country === `法国` &&
          <Button type="primary"
                  onClick={ () => {
                    mainDataList.push({brand: defaultBrand, brandRebate: defaultBrandRebate,});
                    this.setState({mainDataList: mainDataList},(mainDataList = mainDataList) => {
                      changeReciptMoney(mainDataList,true);
                    })
                  }}
          >点击添加品牌</Button>
          }
        </div>
      </div>
    )
  }
}

export default MoneyCalculation;