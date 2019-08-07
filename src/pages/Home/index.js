import React from 'react';
import './index.less';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // 卸载 setState, 防止组件卸载时执行 setState 相关导致报错
  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    return (
      <div className="Home contentMain">
        <p className="title">
          <span>欢迎使用BuyersHouse后台管理系统</span>
        </p>
      </div>
    )
  }
}

export default Home;