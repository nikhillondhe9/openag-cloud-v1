import React, {Component} from 'react';
import '../css/device_homepage.css';
import {Cookies, withCookies} from "react-cookie";
import {$, jQuery} from 'jquery';
import 'rc-time-picker/assets/index.css';
import 'react-console-component/main.css';

class MyPFC extends Component {
    constructor(props) {
        super(props);
        this.state = {}

    }
    render()
    {
        return (<div className="me"></div> )
    }
}
export default withCookies(MyPFC);