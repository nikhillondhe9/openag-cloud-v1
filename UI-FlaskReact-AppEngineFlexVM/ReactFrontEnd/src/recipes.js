import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from "react-router-dom";
import './recipes.css';
import {Cookies, withCookies} from "react-cookie";


class recipes extends Component {
    constructor(props) {
        super(props);

    }
    editRecipe(recipe_id)
    {
        console.log(recipe_id)
        window.location.href = '/edit_recipe/'+('0').toString()

    }
    componentWillMount()
    {
        if (this.props.cookies.get('user_token') === '') {
            window.location.href="/login"
        }
    }
    render() {
        return (
            <Router>
                <div className="recipe-container">
                    <div className="row card-row">
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Standard Recipe</h5>
                                    <h6 className="card-subtitle mb-2 text-muted"></h6>
                                    <p className="card-text" >Use this template recipe to create your custom recipes</p>
                                    <div onClick={this.editRecipe} className="card-link">Edit Recipe</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Router>

        );
    }
}

export default withCookies(recipes);
