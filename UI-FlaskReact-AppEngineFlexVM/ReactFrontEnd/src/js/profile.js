import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";

class profile extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };

    }

    render() {
        return (
            <div className="home-container"></div>
        )
    }
}

export default withCookies(profile);
