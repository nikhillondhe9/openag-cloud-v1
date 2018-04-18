import React, {Component} from 'react';
import '../css/App.css';
import {BrowserRouter as Router, Route, Link, Switch} from "react-router-dom";
import {SignUp} from "./signup";
import login from "./login";
import Home from "./home";
import recipes from "./recipes";
import EditRecipe from './edit_recipe';
import {instanceOf} from 'prop-types';
import {Cookies, withCookies} from "react-cookie";
import DeviceHomepage from "./device_homepage";

class App extends Component {

    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            user_token: props.cookies.get('user-token') || '',
            username: '',
            user_uuid:'',
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

                                <div className="col-md-4 icon-holder">
                                    <Link to="/home">
                                        <div className="load-1">
                                            <div className="line"></div>
                                            <div className="line"></div>
                                            <div className="line"></div>
                                            <div className="label">Home</div>

                                        </div>
                                    </Link>

                                </div>
                                <div className="col-md-4 icon-holder">
                                    <Link to="/recipes">
                                        <div className="load-1">
                                            <div className="line"></div>
                                            <div className="line"></div>
                                            <div className="line"></div>
                                            <div className="label">Recipes</div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-md-4 icon-holder">
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
                            <Route path='/login' component={login}/>
                            <Route path='/signup' component={SignUp}/>
                            <Route path='/edit_recipe/:recipe_uuid' component={EditRecipe}/>
                             <Route path='/device/:device_uuid' component={DeviceHomepage}/>
                            <Route path='/' component={Home}/>

                            <Route path='/home/:user_uuid' component={Home} />
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

export default withCookies(App);
