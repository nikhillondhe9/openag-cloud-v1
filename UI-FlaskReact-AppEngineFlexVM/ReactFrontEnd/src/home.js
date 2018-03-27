import React, {Component} from 'react';
import './home.css';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import logo from './logo.png';

class Home extends Component {
    constructor(props) {
        super(props);
        //Start Fetching data
        this.username = this.props.match.params.username

    }

    render() {
        return (
            <div className="container home-container">
                <div className="row image-row">
                    Welcome, {this.username}!
                </div>

                <div>
                    Your current Device Status
                </div>
            </div>

        );
    }
}

export default Home;
