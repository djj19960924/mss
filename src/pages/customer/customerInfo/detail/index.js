import React, { Component } from 'react'
import { Form, Input,Spin} from 'antd';
import './index.less';
import axios from 'axios';
import { checkData } from '@js/utils'
const FormItem = Form.Item;

@Form.create()
class CustomerInfoDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            //客户所有信息 
            info:{},
            
        }
    }
    componentDidMount() {
        //const { id } = this.props.location.query;
        const id = localStorage.getItem("id")
        this.getCustomerInfoDetail(id)
    }

    //根据客户id获取客户信息详情
    getCustomerInfoDetail(id) {
        axios.get(`http://192.168.31.211:8080//customerManage/get/${id}`).then(r=>{
            if(r.data.status===10000){
                const {data} = r.data;
                this.setState({
                    info:data
                })
            }
        })
    }
    
    render() { 
        const { info } = this.state; 
        if(checkData(info)){
            var attribute = [
                {name:"头像",value:info.headImgUrl},
                {name:"客户ID",value:info.id},
                {name:"昵称",value:info.nickname},
                {name:"账号(手机号)",value:info.phone},
                {name:"客户级别",value:info.levelName},
                {name:"客户备注",value:info.note},
                {name:"余额",value:info.balance}
            ];
            return ( 
                <div className="customerInfoDetail contentMain">
                    <div className="title">
                        <div className="titleMain">客户信息详情</div>
                        <div className="titleLine"></div> 
                    </div>
                    <div className="detailList">
                        
                        {
                            attribute.map((item,key)=>{
                                if(item.name=="头像"){
                                    return (
                                        <div className="detail" key={key}>
                                           <span>{item.name}：</span>
                                           {
                                               item.value?(<img src={item.value} style={{width:50,height:50}} className="detail-value" />):"暂无"
                                           }
                                        </div>
                                    )
                                }else{
                                    return (
                                        <div className="detail" key={key}>
                                           <span>{item.name}：</span>
                                           <span className="detail-value">{item.value}</span>
                                        </div>
                                    )
                                }
                                
                            })
                        }
                    </div>
                </div>
            );
        }else {
            return (
              <Spin
                style={{ position: 'absolute', top: 140, left: 0, right: 0 }}
                size="large"
                tip="Loading..."
              />
            );
        }
        
    }
}
 
export default CustomerInfoDetail;