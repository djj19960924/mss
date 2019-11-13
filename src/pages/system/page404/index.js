import React from 'react';

class page404 extends React.Component {
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
      <div className="page404"
           style={{width: '100%',
             height: '100%',
             backgroundColor: '#fff',
             fontSize: '48px',
             textAlign: 'center',
           }}
      >
        <p style={{paddingTop: 260,
             margin: 0
           }}
        >404 Not Found</p>
        <p>未找到当前页面</p>
      </div>
    )
  }
}

export default page404;
