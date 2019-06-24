import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react/index'
import { Form, Icon, Input, Button, Checkbox, message, } from 'antd';
import CanvasNest from 'canvas-nest.js';
import './index.less';

const FormItem = Form.Item;

@inject('appStore') @observer @Form.create()
class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    window.Login = this;
  };
  componentDidMount() {
    this.initBG();
  }

  initBG() {
    // 注入动画
    const config = {
      color: '0,0,0',
      count: 99,
      zIndex: 9,
      opacity: 0.5
    };

    const cn = new CanvasNest(document.querySelector('.Login'), config);
    // Using config rendering effect at 'element'.
    this.setState({
      backGround: cn
    })
  }

  componentWillUnmount() {
    this.state.backGround.destroy();
    // 卸载异步操作设置状态
    this.setState = () => null
  }

  // 提交表单
  handleSubmit = (e) => {
    const { push } = this.props.history;
    const { saveUserData } = this.props.appStore;
    // 当运行当前事件时, 去除其他相关操作绑定s
    e.preventDefault();
    // 这里进行表单验证
    this.props.form.validateFields((err, values) => {
      if (!err) {
        // 判断是否需要前端方法保存当前登录账号, 如需要, 则将账号信息保存进cookie
        if (values.remember) window.setCookie('saveUserName', values.userName, 3600 * 24 * 7);
        else window.delCookie('saveUserName');

        // 登陆
        this.ajax.post('/login/auth', {
          userName: values.userName,
          password: values.password
        }).then(r => {
          if (r.data.status === 10000) {
            message.success(r.data.msg);
            // 置登陆状态
            window.setCookie('isLogin','true',3600 * 10);
            let historyPath = window.getQueryString('historyPath');
            if (!historyPath || localStorage.historyUserName !== values.userName) historyPath = '/';
            // 登陆时单独保存登陆名
            saveUserData({userName: values.userName});
            push(historyPath);
          }
          r.showError();
        }).catch(r => {
          message.error('前端接口调取/数据处理出现错误, 请联系管理员');
        });
      }
    });
  };
  render() {
    // 将表单数据保存至this.props.form, 由form组件托管当前数据
    const { getFieldDecorator } = this.props.form;
    return(
      <div name="Login" className="Login" style={{textAlign:'center'}}>
        {/*表单容器*/}
        <div className="loginContainer">
          <Form onSubmit={this.handleSubmit.bind(this)} className="loginForm">
            <FormItem>
              {getFieldDecorator('userName', {
                rules: [{ required: true, message: 'Please input your username!' }],
                initialValue: window.getCookie('saveUserName') ? window.getCookie('saveUserName') : '',
              })(
                <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="请输入用户名" />
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('password', {
                rules: [{ required: true, message: 'Please input your Password!' }],
              })(
                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="请输入密码" />
              )}
            </FormItem>
            <FormItem>
              {/*设置是否记住该账号*/}
              {getFieldDecorator('remember', {
                valuePropName: 'checked',
                initialValue: true,
              })(
                <Checkbox className="remember">保存当前用户名</Checkbox>
              )}
              <Link className="loginFormForgot"
                    to="/forgot-password"
              >忘记密码？请点击</Link>
              <Button type="primary" htmlType="submit" className="loginFormButton" style={{width: '100%', marginTop: '10px'}}>
                登录
              </Button>
              {/*后台管理系统暂不支持开放注册*/}
              {/*Or <a href="">register now!</a>*/}
            </FormItem>
          </Form>
          <p className="info">欢迎登陆后台管理系统</p>
        </div>
      </div>
    )
  }
}

export default Login;