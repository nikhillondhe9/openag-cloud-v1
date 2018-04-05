import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from "react-router-dom";
import './recipes.css';
import {Cookies, withCookies} from "react-cookie";


class recipes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            all_recipes: []
        }
        this.getAllRecipes = this.getAllRecipes.bind(this)
    }

    editRecipe(recipe_id) {
        window.location.href = '/edit_recipe/' + recipe_id.toString()
    }

    componentWillMount() {
        if (this.props.cookies.get('user_token') === '') {
            window.location.href = "/login"
        }
    }

    componentDidMount() {
        console.log("Mouting component")
        this.getAllRecipes()
    }

    getAllRecipes() {
        return fetch('http://food.computer.com:5000/api/get_all_recipes/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.setState({all_recipes: responseJson["results"]})
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {
        let listRecipes = <p>Loading</p>
        if (this.state.all_recipes.length > 0) {
            listRecipes = this.state.all_recipes.map((recipe) => {
                return <div className="col-md-3" key={recipe.recipe_uuid}>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{recipe.recipe_name}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">{recipe.recipe_plant}</h6>
                            {/*<p className="card-text">Use this template recipe to create your custom recipes</p>*/}
                            <div onClick={this.editRecipe.bind(this,recipe.recipe_uuid)} id={recipe.recipe_uuid} className="card-link">Edit Recipe</div>
                        </div>
                    </div>
                </div>
            });
        }
        return (
            <Router>
                <div className="recipe-container">
                    <div className="row card-row">
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Standard Recipe</h5>
                                    <h6 className="card-subtitle mb-2 text-muted"></h6>
                                    <p className="card-text">Use this template recipe to create your custom recipes</p>
                                    <div onClick={this.editRecipe.bind(this,'0')} className="card-link">Edit Recipe</div>
                                </div>
                            </div>
                        </div>
                        {listRecipes}
                    </div>
                </div>
            </Router>

        );
    }
}

export default withCookies(recipes);
