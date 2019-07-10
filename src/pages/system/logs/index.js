import React from 'react';
import logsData from './logsData';
import './index.less';

class logs extends React.Component{
  constructor(props) {
    super(props);
    this.state = {}
  }
  render() {
    return (
      <div className="logs">
        <p className="title">
          <span>日志页面</span>
        </p>
        <div className="dividingLine"/>

        <div className="main">
          {logsData.map((item, index) => (
            <div className="updateInfo"
                 key={index}
            >
              <div className="infoTitle">{item.title}</div>
              <div className="dividingLine shot"/>
              {item.main.map((mainItem, mainIndex) => (
                <p key={mainIndex}
                   style={item.color[`${mainIndex}`] ?
                     {color: item.color[`${mainIndex}`]} : null}
                >{mainItem}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
}

export default logs;