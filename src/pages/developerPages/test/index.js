import React from 'react';
import './index.less';

class Test extends React.Component{
  constructor(props) {
    super(props);
    this.state = {}
  }
  render() {
    return (
      <div className="test contentMain">
        测试用页面
      </div>
    )
  }
}

export default Test;