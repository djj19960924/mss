/*
  ┏━━━━━━━━━━ 方法信息 ━━━━━━━━━━┓
  ┃由于权限接口所需 这里必须使用原生ajax方法        ┃
  ┃出于使用需求 这里将改造原生ajax方法             ┃
  ┃以下代码将被注入至 React.Component.prototype   ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
 使用示例:
  this.ajax.post('', data).then(r => {
    r.showError();
  }).catch(r => {
    console.error(r);
    this.ajax.isReturnLogin(r, this);
  });
*/
import { message } from 'antd';

class Ajax {
  headers = {
    'Content-Type': 'application/json'
  };
  origin = window.ajaxUrl;

  // 注入公共配置
  injectMethod(request,headers) {
    // 默认允许跨域传递 cookie, 以便进行权限验证
    request.withCredentials = true;
    // 默认处理返回数据格式为 json 格式
    request.responseType = 'json';
    // 设置头
    if (!headers) headers = this.headers;
    for (let n in headers) {
      request.setRequestHeader(n, headers[n]);
    }
  }

  // promise方法
  promise(request,data,originType) {
    return new Promise((resolve, reject) => {
      // 当接口调取状态变更时触发
      request.onreadystatechange = () => {
        // 处理返回状态, 以便使用 then 和 catch 方法
        // readyState 为 4 时, 为接口调取行为结束
        if(request.readyState === 4){
          // status 为 200 时, 判断为正常接通接口
          if(request.status === 200){
            // 进入 then 方法, 并将 resolve 发送至 then
            resolve(new resolveResponse(request.response));
          } else {
            reject(request);
          }
        }
      };
      request.onerror = () => {
        console.error(request)
      };
      // 开始发送请求
      if (data) {
        if (originType) {
          request.send(data)
        } else {
          request.send(JSON.stringify(data))
        }
      } else {
        request.send()
      }
    })
  }

  // post方法
  post(path, data, headers, originType, origin) {
    let request = new XMLHttpRequest();
    // 开启 request 对象, 指定 post 方法, 输入 url
    request.open('POST', `${origin ? origin : this.origin}${path}`, true);
    // 注入公共配置
    this.injectMethod(request, headers);
    return this.promise(request, data, originType);
  }

  // get方法
  get(path, string, headers, origin) {
    let request = new XMLHttpRequest();
    const queryString = string ? `?${string}` : '';
    // 开启 request 对象, 指定 get 方法, 输入 url
    request.open('GET', `${origin ? origin : this.origin}${path}${queryString}`, true);
    // 注入公共配置
    this.injectMethod(request, headers, 'get');
    return this.promise(request);
  }

  // 判断是否为 XMLHttpRequest
  isXMLHttpRequest(data) {
    return Object.prototype.toString.call(data) === '[object XMLHttpRequest]'
  }

  // 处理重定向等失去用户权限错误
  isReturnLogin(r, that) {
    if (this.isXMLHttpRequest(r)) {
      // 判断内容依然为 request 对象时触发
      if (r.status === 0) {
        message.error('登录信息验证失败, 请重新登陆');
        const {history, location} = that.props;
        window.delCookie('isLogin');
        history.push(`/login?historyPath=${location.pathname}${encodeURIComponent(location.search)}`);
      } else if (r.status === 500) {
        message.error(`${r.response.message} 错误码:${r.status}`);
      } else {
        message.error('接口调取异常, 请联系管理员');
      }
    } else {
      message.error('接口调取或接口数据处理失败, 请联系管理员');
    }
  }
}

// 处理 resolve 事件
class resolveResponse {
  constructor(r) {
    this.data = r;
  }
  // 处理错误
  showError() {
    const {data} = this;
    if (!data.msg && !data.data) {
      // 后端未处理报错, 返回为后端错误
      message.error('服务器接口处理错误, 请联系管理员')
    } else {
      // 后端成功处理该接口
      if (data.status === 10000) {
        // 如成功, 则默认静默不做处理
      } else if (data.status > 10000) {
        // 后端约定: 大于 10000 做报错处理
        message.error(`${data.msg} 状态码:${data.status}`)
      } else if (data.status < 10000) {
        // 后端约定: 小于 10000 做警告处理
        message.warn(data.msg);
      }
    }
  }
}

export default Ajax;
