import React from 'react';
import {Select, Input, Button, message} from 'antd';
import { inject, observer } from 'mobx-react';
import './index.less';

@inject('appStore') @observer
class rebateCountryInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nationName: '韩国',
      copyInfo: '',
      allLoading: false,
    }
    window.test = this;
  }

  allow = this.props.appStore.getAllow.bind(this);
  componentDidMount() {
    this.selectCopyWriterByNationName();
  }

  // 根据国家名称查询文案
  selectCopyWriterByNationName() {
    const {nationName} = this.state;
    const showLoading = Is => this.setState({allLoading: Is});
    showLoading(true);
    const data = {nationName};
    this.ajax.post('/mallCopywriter/selectCopyWriterByNationName', data).then(r => {
      const {status, data} = r.data;
      if (status === 10000) {
        this.setState({copyInfo: data.copyInfo})
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  changeNationName(nationName) {
    this.setState({nationName}, () => {
      this.selectCopyWriterByNationName();
    })
  }
  // 上传编辑文案
  insertOrUpdateMallCopywriter() {
    const {nationName, copyInfo} = this.state;
    const showLoading = Is => this.setState({allLoading: Is});
    showLoading(true);
    const data = {nationName, copyInfo};
    this.ajax.post('/mallCopywriter/insertOrUpdateMallCopywriter', data).then(r => {
      const {status, msg} = r.data;
      if (status === 10000) {
        message.success(msg);
      }
      showLoading(false);
      r.showError();
    }).catch(r => {
      showLoading(false);
      console.error(r);
      this.ajax.isReturnLogin(r, this);
    });
  }

  submit() {
    this.insertOrUpdateMallCopywriter()
  }

  render() {
    const {Option} = Select;
    const {nationName, copyInfo, allLoading} = this.state;
    const {TextArea} = Input;
    return (
      <div className="rebateCountryInfo">
        <div className="title">
          <div className="titleMain">设置说明文案</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <div className="label">请选择国家: </div>
          <Select className="selectCountry"
                  placeholder="请选择国家"
                  value={nationName}
                  loading={allLoading}
                  onChange={this.changeNationName.bind(this)}
          >
            <Option value="韩国">韩国</Option>
            <Option value="日本">日本</Option>
            <Option value="法国">法国</Option>
          </Select>
        </div>
        <div className="btnLine">
          <TextArea className="copyInfoInput"
                    value={copyInfo}
                    onChange={e => this.setState({copyInfo: e.target.value})}
                    autosize={{minRows: 5}}
                    disabled={allLoading}
          />
          <Button className="submit"
                  type="primary"
                  loading={allLoading}
                  onClick={this.submit.bind(this)}>提交更改</Button>
        </div>
      </div>
    )
  }
}

export default rebateCountryInfo;