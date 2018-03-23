import React, {Component} from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";

class Home extends Component {
    constructor(props) {
        super(props);


    }

    render() {
        return (
            <p>I am home</p>
        );
    }
}

export default Home;
