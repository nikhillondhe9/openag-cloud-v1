import React, {Component} from 'react';
import '../css/App.css';
import {BrowserRouter as Router, Route, Link, Switch} from "react-router-dom";
import {SignUp} from "./signup";
import login from "./login";
import profile from "./profile";
import Home from "./home";
import recipes from "./recipes";
import EditRecipe from './edit_recipe';
import NewRecipe from "./new_recipe";
import {instanceOf} from 'prop-types';
import {Cookies, withCookies} from "react-cookie";
import DeviceHomepage from "./device_homepage";
import RecipeDetails from "./recipe_details";
import homeIcon from "../images/home.png";
import profileIcon from "../images/users.png";
import toolsIcon from "../images/tools.png";
import dashboardIcon from "../images/dashboard.png";

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
                           <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8">d</script>

                            <div className="row header-row">

                                <div className="col-md-3 icon-holder">
                                    <Link to="/home">
                                        <div className="load-1">
                                            {/*<img src={homeIcon} className="icon-image"></img>*/}
                                            <img className="home-icon" src={homeIcon}/>
                                            <div className="label">Home</div>

                                        </div>
                                    </Link>

                                </div>
                                <div className="col-md-3 icon-holder">
                                    <Link to="/recipes">
                                        <div className="load-1">
                                            <img className="home-icon" src={toolsIcon}/>
                                            <div className="label">Climate Recipes</div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-md-3 icon-holder">
                                    <Link to="/dashboard">

                                        <div className="load-1">
                                            <img className="home-icon" src={dashboardIcon}/>
                                            <div className="label">MyPFC</div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-md-3 icon-holder">
                                    <Link to="/profile">
                                        <div className="load-1">
                                            <img className="home-icon" src={profileIcon}/>
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
                            <Route path='/profile' component={profile}/>
                            <Route path='/dashboard' component={DeviceHomepage}/>
                            <Route path='/new_recipe/:recipe_uuid' component={NewRecipe}/>
                            <Route path='/edit_recipe/:recipe_uuid' component={EditRecipe}/>
                            <Route path='/device/:device_uuid' component={DeviceHomepage}/>
                            <Route path='/recipe_details/:recipe_uuid' component={RecipeDetails} />
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
