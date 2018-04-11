import React, {Component} from 'react';
import './App.css';
import './login.css';
import {Cookies, withCookies} from "react-cookie";

class DeviceHomepage extends Component {
    constructor(props) {
        super(props);


    }


    render() {
        return (<h6>HELLLOLLO</h6>)
    }
}

export default withCookies(DeviceHomepage);
