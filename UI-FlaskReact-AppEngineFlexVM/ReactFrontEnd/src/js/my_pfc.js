import React, {Component} from 'react';
import "../scss/my_pfc.scss";
import {Cookies, withCookies} from "react-cookie";
import {$, jQuery} from 'jquery';


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