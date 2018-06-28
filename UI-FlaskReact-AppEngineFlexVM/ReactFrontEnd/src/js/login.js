import React, {Component} from 'react';
import logo from '../images/logo.svg';
import '../scss/login.scss';
import {Link} from "react-router-dom";
import {Cookies, withCookies} from "react-cookie";

class login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            error_message: '',
            render: false
        };
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        console.log("Did mount called");
        const token = this.props.cookies.get("user_token");
        if (!token) {
            this.setState({render: true});
            return;
        }

        fetch(process.env.REACT_APP_FLASK_URL + '/api/verify_user_session/', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': token
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson);
                if (responseJson["response_code"] != 200) {
                    this.setState({render: true});
                    console.log("Bad response");
                }

                console.log(responseJson);
                if (responseJson["is_expired"]) {
                    this.setState({render: true});
                    this.props.cookies.remove("user_token");
                } else {
                    const user_uuid = responseJson["user_uuid"];
                    window.location.href = "/home/"+(user_uuid).toString()
                }
            })
            .catch((error) => {
                console.error(error);
            });
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

        return fetch( process.env.REACT_APP_FLASK_URL + '/login/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials':true
            },
            body: JSON.stringify({
                'username': this.state.username,
                'password': this.state.password
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"]== 200){
                    let user_uuid = responseJson["user_uuid"]
                    this.props.cookies.set('user_token',responseJson['user_token'])
                    window.location.href = "/home/"+(user_uuid).toString()
                } else {
                    let error_message = responseJson["message"]
                    this.setState({error_message: error_message})
                }

            })
            .catch((error) => {
                console.error(error);
            });

    }

    render() {
        if (this.state.render) {
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
                        <form onSubmit={this.handleSubmit}>
                            <input type="text" placeholder="username" name="username" value={this.state.username}
                                   onChange={this.handleChange}/>
                            <input type="password" placeholder="password" name="password" value={this.state.password}
                                   onChange={this.handleChange}/>
                            <button>login</button>

                            <p className="message">Not registered? <Link to="signup"> Create an account </Link> </p>
                        </form>
                    </div>
                </div>
            )
        } else {
            return null;
        }
    }
}

export default withCookies(login);
