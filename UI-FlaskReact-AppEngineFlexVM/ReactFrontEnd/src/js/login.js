import React, {Component} from 'react';
import logo from '../images/logo.svg';
import '../css/App.css';
import '../css/login.css';
import {Link} from "react-router-dom";
import {Cookies, withCookies} from "react-cookie";

import * as api from './utils/api';

class login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            error_message: ''
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

        console.log('A login form was submitted: ' + this.state);
        this.loginUser()
        event.preventDefault();
    }

    loginUser() {
        api.login(this.state.username, this.state.password)
        .then((responseJson) => {
            console.log(responseJson);
            if (responseJson["response_code"]== 200) {
                let user_uuid = responseJson["user_uuid"];
                this.props.cookies.set('user_token',responseJson['user_token']);
                window.location.href = "/home/" + (user_uuid).toString();
            }
        })
        .catch((error) => {
            console.error(error);
        });
    }

    render() {

        return (
            <div className="login-page">
                <div className="form">
                    {this.state.error_message &&
                        <p style={{color: 'red'}}>
                            {this.state.error_message}
                        </p>
                    }
                    <div className="image-section">
                        <img className="logo" src={logo}></img>
                    </div>
                    <form className="login-form" onSubmit={this.handleSubmit}>
                        <input type="text" placeholder="username" name="username" value={this.state.username}
                               onChange={this.handleChange} required/>
                        <input type="password" placeholder="password" name="password" value={this.state.password}
                               onChange={this.handleChange} required/>
                        <button>login</button>

                        <p className="message">Not registered? <Link to="signup"> Create an account </Link> </p>
                </form>
            </div>

    </div>

    )
        ;
    }
}

export default withCookies(login);
