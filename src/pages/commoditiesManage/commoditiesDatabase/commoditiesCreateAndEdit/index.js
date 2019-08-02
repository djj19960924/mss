import React from 'react';
import { Button, Form, Select, Input, InputNumber, message, Icon, Modal, Radio, } from 'antd';
import { inject, observer } from 'mobx-react/index';

import './index.less';

const FormItem = Form.Item;
const Option = Select.Option;

@inject('appStore') @observer @Form.create()
class commoditiesCreateAndEdit extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      // 公共传参
      type: 'create',
      skuId: 'null',
      // 标题显示
      titleName: '录入',
      // 图片地址
      imgList: [],
      // 图片预览
      previewVisible: false,
      // 预览图片地址
      previewImage: '',
      // 预览图片宽高比
      previewImageWH: [],
      // 商品进货价货币类型
      costType: 0,
      // 商品原价货币类型
      originalType: 0,
      // 品类列表
      categoryList: [],
      // 获取的品类以及库存单位列表
      productCategoryList: [],
      // 单位名称
      unitName: '(根据品类获取)',
      // 行邮税号
      postcode: '',
      // Loading状态
      isLoading: false,
      // Loading提示文字
      loadingTxt: 'Loading...',
      // 提交按钮loading
      submitLoading: false,
      record: null,
    };
  }

  componentDidMount() {
    const { type, skuId, record } = window.getAllQueryString();
    // 获取所有品类列表,以及数量单位
    this.ajax.post('/sku/getAllProductCategory').then(r => {
      if (r.data.status === 10000) {
        const { data } = r.data, dataList = [];
        // 这里的value会作为选择框的搜索字段, 所以需求同时可以根据Id或者Name查询, 则在value值中同时插入Id和Name
        // 但是注意最终传值时不要取value
        for (let i in data) dataList.push(<Option value={data[i].name} key={i}>{data[i].name}</Option>);
        this.setState({categoryList:dataList, productCategoryList:data, record:record});
        this.setForm(type,skuId);
      }
    }).catch(r => {
      this.ajax.isReturnLogin(r,this);
    });
  }
  // 根据 type 填写表单
  setForm(type,skuId) {
    // 根据 type 判断行为
    if (type === 'create') {
      this.setState({
        titleName: '录入',
        type: type,
        skuId: skuId,
      });
      if (!!localStorage.newImgList) {
        this.setState({
          imgList: JSON.parse(localStorage.newImgList).imgList
        },()=>{this.showImg()})
      }
      this.props.form.setFieldsValue({
        sugPostway: 2
      });
      if (!!localStorage.skuInfo && !!localStorage.skuInfoState) {
        this.props.form.setFieldsValue(JSON.parse(localStorage.skuInfo));
        this.setState(JSON.parse(localStorage.skuInfoState));
      }
    } else if (type === 'edit') {
      // 打开loading
      this.setState({
        titleName: '编辑',
        isLoading: true,
        loadingTxt: '数据加载中, 请稍后...',
        type: type,
        skuId: parseInt(skuId),
      });
      this.ajax.post('/sku/selectEditSkuBySkuId',{skuId:skuId}).then(r => {
        // 关闭loading
        this.setState({
          isLoading: false,
          loadingTxt: 'Loading...'
        });
        if (r.data.status === 10000) {
          // 成功
          const d = r.data.data;
          // 将图片地址保存在本地缓存
          localStorage.imgList = JSON.stringify({imgList: d.imgList});
          const dataList = [];
          if (Array.isArray(d.imgList)) {
            for (let v of d.imgList) {
              dataList.push(`//${v.split('//')[1]}`)
            }
          } else {
            // d.imgList为空时, 值恒定为null, 这里不做处理, 直接赋值空数组
          }
          // 图片存入 state 供读取使用
          this.setState({
            imgList: dataList,
          });
          // 获取单位
          let pCL = this.state.productCategoryList;
          for (let i in pCL) if (pCL[i].name === d.category) this.setState({unitName:pCL[i].modelNumber});
          // 这里设置表单默认值
          this.props.form.setFieldsValue({
            skuCode: d.skuCode,
            category: d.category,
            name: d.name,
            netWeight: d.netWeight,
            costPrice:d.costPrice,
            brand: d.brand,
            sugPostway: d.sugPostway,
            specificationType: d.specificationType,
            stock: d.stock,
            sugPrice: d.sugPrice,
            recordPrice: d.recordPrice,
            taxRate: d.taxRate,
            purchaseArea: d.purchaseArea,
            modelNumber: d.modelNumber,
            isRecord: d.isRecord,
            originalPrice: d.originalPrice,
            customsCode: d.customsCode,
          });
          this.setState({
            costType: d.costType,
            originalType: d.originalType,
            postcode: d.postcode
          });
        }
      }).catch(r => {
        console.error(r);
        this.ajax.isReturnLogin(r,this)
      });
    } else {
      message.error('错误的商品处理类型, 即将返回商品库页面!');
      this.backTo();
    }
  }
  // 渲染成功触发
  componentDidUpdate(prevProps, prevState, snapshot) {
    this.showImg();
  }
  // 渲染预览图片事件
  showImg() {
    const { imgList, } = this.state;
    for (let i in imgList) {
      let item = document.getElementById(`goodsImg_${i}`);
      item.onload = (e) => {
        let pI = document.getElementById(`goodsImg_${i}`);
        const dataList = this.state.previewImageWH;
        if ((pI.width / pI.height) < (2 / 3)) {
          dataList[i] = 'height'
        } else if ((pI.width / pI.height) >= (2 / 3)) {
          dataList[i] = 'width'
        }
        this.setState({
          previewImageWH: dataList
        },() => {
          pI.style.visibility = `visible`;
        });
      };
      item.onerror = (e) => {
        message.error('图片加载失败');
        // 图片如果未加载出, 也放开显示, 标出图片未加载的默认样式
        let pI = document.getElementById(`goodsImg_${i}`);
        pI.style.visibility = `visible`;
      }
    }
  }
  // 查看图片
  imagePreview(f) {
    this.setState({
      previewImage: f,
      previewVisible: true,
    });
  }
  // 关闭图片预览
  closePreview() {
    this.setState({
      previewVisible: false,
    })
  }
  // 改变品类触发
  changeCategory(name,e) {
    const { productCategoryList, } = this.state;
    this.setState({
      postcode: productCategoryList[e.key].taxNumber,
      unitName: productCategoryList[e.key].modelNumber,
      // modelNumber: productCategoryList[e.key].modelNumber,
    });
    this.props.form.setFieldsValue({
      specificationType: productCategoryList[e.key].specification,
      modelNumber: productCategoryList[e.key].modelNumber,
    });
  }
  // 返回上一个界面
  backTo() {
    const { record, } = this.state;
    // this.props.history.goBack()
    // 输入准确地址, 以保证返回按钮只能回到具体页面
    this.props.history.push(`/commodities-manage/commodities-database?record=${record}`);
    localStorage.removeItem('skuInfo');
    localStorage.removeItem('skuInfoState');
  }
  // 进入编辑图片界面
  gotoEditImg() {
    const { type, record, skuId } = this.state;
    let the = this.state;
    localStorage.skuInfo = JSON.stringify(this.props.form.getFieldsValue());
    localStorage.skuInfoState = JSON.stringify({
      costType: the.costType,
      originalType: the.originalType,
      postcode: the.postcode,
    });
    this.props.history.push(`/commodities-manage/commodities-database/commodities-img-list?type=${type}&skuId=${skuId}&record=${record}`);
  }
  // 提交按钮
  submit() {
    const { type, } = this.state;
    this.submitForm(type);
    localStorage.removeItem('skuInfo');
    localStorage.removeItem('skuInfoState');
  }
  // 上传表单
  submitForm(type) {
    const { skuId, costType, postcode, imgList, originalType, } = this.state;
    this.props.form.validateFields((err, val) => {
      if (!err) {
        this.setState({submitLoading: true});
        // 重置数据
        let data = val;
        data.costType = costType;
        data.originalType = originalType;
        if (this.props.form.getFieldsValue().sugPostway === 1) {
          data.postcode = postcode;
        }
        for (let i in data) {
          // InputNumber 将输入框删除时, 值为 undefined , Input 删除时, 值为 ''
          // 该两项值为空时, 强制转为 null , 用于保存删空修改
          if (data[i] === undefined || data[i] === '') data[i] = null;
        }
        let skuUrl;
        if (type === 'create') {
          // 新增
          data.imgList = imgList;
          skuUrl = `/sku/uploadSku`;
        } else if (type === 'edit') {
          // 修改
          data.skuId = skuId;
          skuUrl = `/sku/editSku`;
        }
        this.ajax.post(skuUrl,data).then(r => {
          if (r.data.status === 10000) {
            message.success(`${r.data.msg}`);
            this.setState({submitLoading: false});
            this.backTo();
          }
          r.showError();
        }).catch(r => {
          this.setState({submitLoading: false});
          this.ajax.isReturnLogin(r,this);
        });
      }
    })
  }
  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { titleName, costType, postcode, isLoading, loadingTxt, imgList, previewVisible, previewImage, previewImageWH, categoryList, originalType, submitLoading, } = this.state;
    const RadioButton = Radio.Button;
    const RadioGroup = Radio.Group;
    return (
      <div className="commoditiesCreateAndEdit contentMain">
        {/*loading遮罩层*/}
        {isLoading && <div className="loading">
          <div className="loadingMain">
            <Icon type="loading" /> {loadingTxt}
          </div>
        </div>}

        {/*标题*/}
        <div className="title">
          <div className="titleMain">商品{titleName}</div>
          <div className="titleLine" />
        </div>

        {/*表单*/}
        <div className="formList">
          <Form>
            {/*商品条形码*/}
            <FormItem label="商品条形码"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 12}}
            >
              {getFieldDecorator('skuCode', {
                rules: [
                  {required: true, message: '请输入商品条形码!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="这里输入商品条形码"
                />
              )}
              {/*<span style={{marginLeft: 10}}>(选填)</span>*/}
            </FormItem>

            {/*商品名称*/}
            <FormItem label="商品名称"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 12}}
            >
              {getFieldDecorator('name', {
                rules: [
                  {required: true, message: '请输入商品名称!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请输入商品名称"
                />
              )}
            </FormItem>

            {/*商品照片*/}
            <FormItem colon
                      // label="商品照片(1-3张)"
                      label="商品照片(最多3张)"
                      labelCol={{span: 4}}
                      wrapperCol={{span: 20}}
                      className="imgList"
            >
              {imgList.length === 0 ? '' :
                imgList.map((item,i) => (
                  <div className="imgDiv"
                       key={`id_${i}`}
                  >
                    <img src={item}
                         id={`goodsImg_${i}`}
                         style={{
                           width: previewImageWH[i] === 'width' ? '100%' : 'auto',
                           height: previewImageWH[i] === 'height' ? '100%' : 'auto',
                           visibility: `hidden`,
                         }}
                         onClick={this.imagePreview.bind(this,item)}
                    />
                  </div>
                ))}
              <Button type="primary"
                      onClick={this.gotoEditImg.bind(this)}
              >编辑商品照片</Button>
            </FormItem>

            {/*图片预览*/}
            <div>
              {/*图片预览弹窗*/}
              <Modal visible={previewVisible}
                     footer={null}
                     onCancel={this.closePreview.bind(this)}
              >
                <img alt="example" style={{ width: '100%' }} src={previewImage} />
              </Modal>
            </div>

            {/*净重*/}
            <FormItem label="净重(kg)"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 12}}
            >
              {getFieldDecorator('netWeight', {
                rules: [
                  {required: true, message: '请输入重量!'},
                ],
              })(
                <InputNumber style={{width: 180}}
                             placeholder="请输入重量"
                             min={0}
                             precision={4}
                />
              )}
              <span style={{marginLeft: 10}}>毛重: {typeof(getFieldValue('netWeight')) === `number` ? (getFieldValue('netWeight') + 0.03).toFixed(4) : ''} kg</span>
            </FormItem>

            {/*选择商品品牌*/}
            <FormItem label="商品品牌"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('brand',{
                rules: [
                  {required: true, message: '请输商品品牌!'},
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请输入商品品牌"
                />
              )}
              <span style={{marginLeft: 10}}>(请输入品牌英文名,以用于备案)</span>
            </FormItem>

            {/*规格型号*/}
            <FormItem label="规格型号"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('specificationType',{
                rules: [
                  { required: true, message: `请输入规格型号` },
                ],
              })(
                <Input style={{width: 180}}
                  // disabled
                       placeholder="请填写规格型号"
                />
              )}
            </FormItem>

            {/*单位*/}
            <FormItem label="单位"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('modelNumber',{
                rules: [
                  { required: true, message: `请输入单位` },
                ],
              })(
                <Input style={{width: 180}}
                       placeholder="请填写单位"
                />
              )}
            </FormItem>

            {/*成本价 / 采购价*/}
            <FormItem label="成本价/采购价"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('costPrice', {
                // rules: [
                //   {required: true, message: '请输入成本价/采购价!'},
                // ],
              })(
                <InputNumber style={{width: 180}}
                             placeholder="请输入成本价/采购价"
                             min={0}
                />
              )}
              {/*选择货币类型*/}
              <Select className="costTypeSelect"
                      style={{width: 100,marginLeft: 10}}
                // 当存在 defaultValue 时, 则无需 placeholder
                // defaultValue={costType}
                      value={costType}
                      onChange={(v) => this.setState({costType: v})}
              >
                <Option value={0}>人民币</Option>
                <Option value={1}>美元</Option>
                <Option value={2}>欧元</Option>
                <Option value={3}>日元</Option>
                <Option value={4}>韩币</Option>
                <Option value={5}>港币</Option>
              </Select>
            </FormItem>

            {/*商品原价*/}
            <FormItem label="商品原价"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('originalPrice')(
                <InputNumber style={{width: 180}}
                             placeholder="请输入商品原价"
                             min={0}
                />
              )}
              {/*选择货币类型*/}
              <Select className="originalType"
                      style={{width: 100,marginLeft: 10}}
                      value={originalType}
                      onChange={(v) => this.setState({originalType: v})}
              >
                <Option value={0}>人民币</Option>
                <Option value={1}>美元</Option>
                <Option value={2}>欧元</Option>
                <Option value={3}>日元</Option>
                <Option value={4}>韩币</Option>
                <Option value={5}>港币</Option>
              </Select>
            </FormItem>

            {/*是否已备案*/}
            <FormItem label="是否已备案"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('isRecord',{
                rules: [
                  {required: true},
                ],
                initialValue: 0
              })(
                <RadioGroup buttonStyle="solid">
                  <RadioButton value={0}>未备案</RadioButton>
                  <RadioButton value={1}>已备案</RadioButton>
                  <RadioButton value={2}>备案中</RadioButton>
                  <RadioButton value={4}>临时已备案</RadioButton>
                  <RadioButton value={3}>作废</RadioButton>
                </RadioGroup>
              )}
            </FormItem>

            {/*备案价*/}
            <FormItem label="备案价"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('recordPrice',{
                rules: [
                  {required: true},
                ],
              })(
                <InputNumber style={{width: 180}}
                             placeholder="请输入备案价"
                             min={0}
                />
              )}
              <span style={{marginLeft: 10}}>(¥)人民币</span>
            </FormItem>

            {/*数量 / 库存*/}
            <FormItem label="数量 / 库存"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('stock')(
                <InputNumber style={{width: 180}}
                             placeholder="请输入数量"
                             min={0}
                />
              )}
              {/*暂不显示单位*/}
              {/*<span style={{marginLeft: 10}}>单位: {unitName}</span>*/}
              <span style={{marginLeft: 10}}>(选填)</span>
            </FormItem>

            {/*税率*/}
            <FormItem label="税率"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('taxRate')(
                <InputNumber style={{width: 180}}
                             placeholder="请输入税率"
                             min={0}
                />
              )}
              <span style={{marginLeft: 10}}>%</span>
            </FormItem>

            {/*采购地*/}
            <FormItem label="采购地"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('purchaseArea')(
                <Input style={{width: 180}}
                       placeholder="请输入采购地"
                />
              )}
              <span style={{marginLeft: 10}}>(选填)</span>
            </FormItem>

            {/*选择商品品牌*/}
            <FormItem label="海关编码"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('customsCode')(
                <Input style={{width: 180}}
                       placeholder="请输入海关编码"
                />
              )}
              <span style={{marginLeft: 10}}>(选填)</span>
            </FormItem>

            {/*建议行邮方式*/}
            <FormItem label="建议行邮方式"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('sugPostway',{
                rules: [
                  { required: true },
                ],
                initialValue: 1
              })(
                <Select className="sugPostway"
                        style={{width: 180}}
                >
                  <Option value={1}>ETK</Option>
                  <Option value={2}>BC</Option>
                </Select>
              )}
              <span style={{marginLeft: 10}}>(选填)</span>
            </FormItem>

            {/*选择商品品类*/}
            {getFieldValue('sugPostway') === 1 &&
            <FormItem label="品类"
                      colon
                      labelCol={{span: 4}}
                      wrapperCol={{span: 15}}
            >
              {getFieldDecorator('category', {
                rules: [
                  {required: true, message: '请选择品类!'},
                ],
              })(
                <Select className="category"
                        style={{width: 180}}
                        placeholder="请选择品类"
                        onChange={this.changeCategory.bind(this)}
                        showSearch
                >
                  {categoryList}
                </Select>
              )}
              <span style={{marginLeft: 10,color: 'rgba(0,0,0,.85)'}}>行邮税号 : </span>
              <Input style={{width: 180}}
                     placeholder="请选择品类"
                     value={postcode}
                     disabled
              />
            </FormItem>}

            {/*建议ETK申报价*/}
            {getFieldValue('sugPostway') === 1 && <FormItem label="建议ETK申报价"
                                                            colon
                                                            labelCol={{span: 4}}
                                                            wrapperCol={{span: 15}}
            >
              {getFieldDecorator('sugPrice',{
                rules: [
                  {required: true, message: '请输入建议ETK申报价!'},
                ],
              })(
                <InputNumber style={{width: 180}}
                             placeholder="请输入建议ETK申报价"
                             min={0}
                />
              )}
              <span style={{marginLeft: 10}}>(¥)人民币</span>
            </FormItem>}

            {/*提交按钮*/}
            <FormItem>
              <Button type="primary"
                      onClick={this.submit.bind(this)}
                      loading={submitLoading}
                      style={{marginLeft: 80}}
              >提交</Button>
              <Button type="primary"
                      onClick={this.backTo.bind(this)}
                      style={{marginLeft: 20}}
              >取消</Button>
            </FormItem>

          </Form>
        </div>

      </div>
    );
  }
}

export default commoditiesCreateAndEdit;