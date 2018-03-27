import React, {Component} from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
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
                            <div className="load-1">
                                <div className="line"></div>
                                <div className="line"></div>
                                <div className="line"></div>
                                <div className="label">My PFC</div>
                            </div>
                        </div>
                        <div className="col-md-3 icon-holder" >
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
                            <div className="load-1">
                                <div className="line"></div>
                                <div className="line"></div>
                                <div className="line"></div>
                                <div className="label">Profile</div>
                            </div>
                        </div>
                    </div>
                    <Route path='/recipes' component={recipes}/>
                    <Route path='/home' component={Home}/>
                    <Route path='/login' component={login}/>
                    <Route path='/signup' component={SignUp}/>
                </header>

            </Router>
        );
    }
}

export default App;
