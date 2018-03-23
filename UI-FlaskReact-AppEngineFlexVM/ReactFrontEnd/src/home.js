import React, {Component} from 'react';
import './home.css';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import logo from './logo.png';

class Home extends Component {
    constructor(props) {
        super(props);


    }

    render() {
        return (
            <div className="container home-container">
                <div className="row image-row">
                    <img src={logo}></img>
                </div>


            </div>

        );
    }
}

export default Home;
