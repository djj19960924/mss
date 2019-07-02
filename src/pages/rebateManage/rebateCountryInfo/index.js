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
      buttonIsLoading: false
    }
  }

  allow = this.props.appStore.getAllow.bind(this);

  // 上传编辑文案
  insertOrUpdateMallCopywriter() {
    const {nationName, copyInfo} = this.state;
    const showLoading = Is => this.setState({buttonIsLoading: Is});
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
    const {nationName, copyInfo, buttonIsLoading} = this.state;
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
                  onChange={nationName => this.setState({nationName})}
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
          />
          <Button className="submit"
                  type="primary"
                  loading={buttonIsLoading}
                  onClick={this.submit.bind(this)}>提交更改</Button>
        </div>
      </div>
    )
  }
}

export default rebateCountryInfo;