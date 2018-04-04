import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {Link} from "react-router-dom";

export class SignUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            password: '',
            email_address: '',
            organization:''
        };
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
        return fetch('http://food.computer.com:5000/api/signup/', {
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
                    this.props.history.push("/login")
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
                    <div className="image-section">
                        <img className="logo" src={logo}></img>
                    </div>
                    <form className="register-form" onSubmit={this.handleSubmit}>
                        <input type="text" placeholder="name" name="name" value={this.state.name}
                               onChange={this.handleChange} required />
                        <input type="password" placeholder="password" name="password" value={this.state.password}
                               onChange={this.handleChange} required/>
                        <input type="text" placeholder="email address" name="email_address"
                               value={this.state.email_address}
                               onChange={this.handleChange} required/>
                        <input type="text" placeholder="organization" name="organization"
                               value={this.state.organization}
                               onChange={this.handleChange}/>

                        <button>create</button>
                        <p className="message">Already registered? <Link to="login"> Sign In </Link></p>
                    </form>
                </div>

            </div>
        );
    }
}
