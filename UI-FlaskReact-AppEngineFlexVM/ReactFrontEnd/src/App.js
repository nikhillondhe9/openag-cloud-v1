import React, {Component} from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Link, Switch} from "react-router-dom";
import {SignUp} from "./signup";
import login from "./login";
import Home from "./home";
import recipes from "./recipes";

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
        this.showHideHeader = this.showHideHeader.bind(this);
        if (window.location.href.indexOf('login') > 0 || window.location.href.indexOf('signup') > 0) {
            this.authentication_page = true

        }
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
        event.preventDefault();
    }

    handleSubmit(event) {

        alert('A login form was submitted: ' + this.state);
        event.preventDefault();
    }

    showHideHeader() {
        if (this.authentication_page) {
            return (<Router>
                <main>
                    <Switch>
                        <Route path='/login' component={login}/>
                        <Route path='/signup' component={SignUp}/>
                    </Switch>
                </main>
            </Router>)
        }
        else {
            return (
                <Router>

                    <main>
                        <header className="header">


                                    <div className="row header-row">

                                        <div className="col-md-3 icon-holder">
                                            <Link to="/home">
                                                <div className="load-1">
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="label">Home</div>

                                                </div>
                                            </Link>

                                        </div>
                                        <div className="col-md-3 icon-holder">
                                            <Link to="/mypfc">
                                                <div className="load-1">
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="label">My PFC</div>
                                                </div>
                                            </Link>
                                        </div>
                                        <div className="col-md-3 icon-holder">
                                            <Link to="/recipes">
                                                <div className="load-1">
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="label">Recipes</div>
                                                </div>
                                            </Link>
                                        </div>
                                        <div className="col-md-3 icon-holder">
                                            <Link to="/profile">
                                                <div className="load-1">
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="line"></div>
                                                    <div className="label">Profile</div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                        </header>
                        <Switch>
                            <Route path='/recipes' component={recipes}/>
                            <Route path='/home/:username' component={Home}/>
                            <Route path='/login' component={login}/>
                            <Route path='/signup' component={SignUp}/>
                        </Switch>
                    </main>
                </Router>
        )
        }
        }

        render() {
            return (
            <div>
            {this.showHideHeader()}
            </div>

            );
        }
        }

        export default App;
