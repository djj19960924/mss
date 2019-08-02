import React from "react";
import "./index.less";
import {Radio} from "antd";
import LogisticsPaymented from "./components/logisticsPaymented";
import LogisticsToBePaid from "./components/logisticsToBePaid";

class OfflinePayment extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      orderType: "0"
    };

  }

  componentWillMount() {
    if(window.getQueryString("type")!==null){
     this.setState({orderType:window.getQueryString("type")})
    }
  }

  render() {
    const {orderType} = this.state;
    return (
      <div className="offline-payment contentMain">
        <div className="title">
          <div className="titleMain">线下支付</div>
          <div className="titleLine" />
        </div>
        <div className="btnLine">
          <Radio.Group className="menu-selection" value={orderType} buttonStyle="solid" onChange={(e) => {
            const {origin, pathname} = window.location;
            window.history.replaceState('','',`${origin}${pathname}?type=${e.target.value}`);
            this.setState({orderType: e.target.value});
          }}>
            <Radio.Button value={"0"}>待支付</Radio.Button>
            <Radio.Button value={"1"}>已支付</Radio.Button>
          </Radio.Group>
        </div>
        {
          orderType === "0" && <LogisticsToBePaid/>
        }
        {
          orderType === "1" && <LogisticsPaymented/>
        }
      </div>
    );
  }
}


export default OfflinePayment;