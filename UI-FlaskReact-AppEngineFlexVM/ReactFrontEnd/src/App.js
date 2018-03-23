import React, {Component} from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import {SignUp} from "./signup";
import login from "./login";
import Home from "./home";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: ''
        };
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
        event.preventDefault();
    }

    handleSubmit(event) {

        alert('A login form was submitted: ' + this.state);
        event.preventDefault();
    }


    render() {

        return (
            <Router>
                <div>
                    <Route path='/login' component={login}/>
                    <Route path='/signup' component={SignUp}/>
                    <Route path='/home' component={Home}/>
                </div>
            </Router>
        );
    }
}

export default App;
