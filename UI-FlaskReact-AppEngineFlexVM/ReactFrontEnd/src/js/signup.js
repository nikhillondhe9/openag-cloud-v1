import React, {Component} from 'react';
import logo from '../images/logo.svg';
import {Link} from "react-router-dom";

export class SignUp extends Component {
    constructor(props) {
        super(props);
        var qs = require('url').parse(window.location.href, true).query;

        if( typeof qs['vcode'] != 'undefined') {
            console.log(qs['vcode'])
            this.vcode = qs['vcode'];
        }
        this.state = {
            name: '',
            password: '',
            email_address: '',
            organization:'',
            error_message: '',
            vcode:this.vcode
        };
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.goToSignIn = this.goToSignIn.bind(this)
    }
    goToSignIn()
    {

        if(this.state.vcode != "" && this.state.vcode != undefined && this.state.vcode != "undefined") {
                        window.location.href = "/login?vcode=" + this.state.vcode
                    }
                    else {
             window.location.href = "/login"
        }
    }
    componentDidMount() {

    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
        event.preventDefault();
    }

    handleSubmit(event) {

        console.log('A signup form was submitted: ' + this.state);
        this.signupUser();
        event.preventDefault();
    }

    signupUser() {
        return fetch( process.env.REACT_APP_FLASK_URL + '/api/signup/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'username': this.state.name,
                'password': this.state.password,
                'email_address': this.state.email_address,
                'organization':this.state.organization
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"]== 200){
                    console.log("Succesfully signed up - redirecting page")
                    if(this.state.vcode != "" && this.state.vcode != undefined && this.state.vcode != "undefined") {
                        window.location.href = "/login?vcode=" + this.state.vcode
                    }
                    else {
             window.location.href = "/login"
        }
                } else {
                    let error_message = responseJson['message']
                    this.setState({error_message: error_message})
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
                    <form className="register-form" onSubmit={this.handleSubmit}>
                        <input type="text" placeholder="name" name="name" value={this.state.name}
                               onChange={this.handleChange} required />
                        <input type="password" placeholder="password" name="password" value={this.state.password}
                               onChange={this.handleChange} required/>
                        <input type="email" placeholder="email address" name="email_address"
                               value={this.state.email_address}
                               onChange={this.handleChange} required/>
                        <input type="text" placeholder="organization" name="organization"
                               value={this.state.organization}
                               onChange={this.handleChange}/>

                        <button>create</button>
                        <p className="message">Already registered? <a onClick={this.goToSignIn}> Sign In </a></p>
                    </form>
                </div>

            </div>
        );
    }
}
