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
      <div className="logs contentMain">
        <p className="title">
          <span>系统日志</span>
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
                   // 1. 判断是否包含 color 对象
                   // 2. 判断是否包含该属性
                   style={!!item.color && item.color[`${mainIndex + 1}`] ?
                     {color: item.color[`${mainIndex + 1}`]} : null}
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