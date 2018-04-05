import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from "react-router-dom";
import './recipes.css';
import {Cookies, withCookies} from "react-cookie";
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

class recipes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            all_recipes: [],
            modal: false,
            selected_recipe: {},
            selected_recipe_json: {}
        };

        this.toggle = this.toggle.bind(this);
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


    toggle(recipe, recipe_json) {

        var json_html_append = [];
        if (recipe !== undefined && recipe_json != undefined) {
            recipe_json = JSON.parse(recipe_json)
            Object.keys(recipe_json).forEach(function (key) {
                if (key !== 'components' && key !== 'user_token' && key !== 'template_recipe_uuid') {
                    json_html_append.push(<div className="row" key={key}>
                        <div className="col-md-6"> {key}</div>
                        <div className="col-md-6"> {recipe_json[key]}</div>
                    </div>)
                }
            })
            this.setState({
                selected_recipe: recipe,
                selected_recipe_json: json_html_append
            })
        }
        this.setState({
            modal: !this.state.modal
        });
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
                let recipe_json_value = JSON.parse(recipe.recipe_json)
                return <div className="col-md-3" key={recipe.recipe_uuid}>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{recipe.recipe_name}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">{recipe.recipe_plant}</h6>
                            <div className="card-text">
                                <div onClick={this.editRecipe.bind(this, recipe.recipe_uuid)} id={recipe.recipe_uuid}
                                     className="card-link">Edit Recipe
                                </div>
                                <div onClick={this.toggle.bind(this, recipe, recipe.recipe_json)} id={recipe.recipe_uuid}
                                     >View Recipe
                                </div>
                            </div>

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
                                    <div className="card-text">Use this template recipe to create your custom recipes </div>
                                    <div className="card-text">
                                         <div onClick={this.editRecipe.bind(this, '0')}
                                        className="card-link">Edit Recipe
                                 </div>
                                </div>
                                </div>


                            </div>
                        </div>
                        {listRecipes}
                    </div>

                    <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
                        <ModalHeader toggle={this.toggle}>Recipe Details</ModalHeader>
                        <ModalBody>
                            <h2> {this.state.selected_recipe.recipe_name}
                                for {this.state.selected_recipe.recipe_plant} </h2>
                            {this.state.selected_recipe_json}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={this.toggle}>Close</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </Router>

        );
    }
}

export default withCookies(recipes);
