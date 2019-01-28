import React from 'react';

class page404 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    // window.page404 = this;
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
