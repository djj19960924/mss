import React from "react";
import {Radio} from "antd";
import "./index.less";
import PurchaseTrip from "./compontents/purchaseTrip";
import WaitPurchasing from "./compontents/purchasing";
import EndOfOrder from "./compontents/endOfOrder";

class GlobalErrandsOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contentType: "0",
    };

  }

  componentWillMount() {
    if (window.getQueryString("contentType") !== null) {
      this.setState({contentType: window.getQueryString("contentType")})
    }
  }

  componentWillUnmount() {
    this.setState = () => null
  }
  render() {
    const {contentType} = this.state;
    return (
      <div className="GlobalErrandsOrder contentMain">
        <div className="title">
          <div className="titleMain">全球跑腿</div>
          <div className="titleLine" />
        </div>
        <Radio.Group defaultValue={contentType} buttonStyle="solid" onChange={(e) => {
          const {origin, pathname} = window.location;
          window.history.replaceState('','',`${origin}${pathname}?contentType=${e.target.value}`);
          this.setState({contentType: e.target.value})
        }} className="menu-selection">
          <Radio.Button value="0">等待采购</Radio.Button>
          <Radio.Button value="1">采购结束</Radio.Button>
          <Radio.Button value="2">采购行程</Radio.Button>
        </Radio.Group>
        {
          contentType === "0" && <WaitPurchasing history={this.props.history} />
        }
        {
          contentType === "1" && <EndOfOrder history={this.props.history} />
        }
        {
          contentType === "2" && <PurchaseTrip />
        }
      </div>
    );
  }
}


export default GlobalErrandsOrder;