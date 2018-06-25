import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from "react-router-dom";
import '../css/recipes.css';
import {Cookies, withCookies} from "react-cookie";
import {
    Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter,
    Form, FormGroup, Label, Input
} from 'reactstrap';

import {RecipeCard} from './components/recipe_card';
import * as api from './utils/api';

class recipes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            all_recipes: new Map(),
            filtered_recipes: new Map(),
            filter_recipe_button_state: 'all',
            modal: false,
            apply_to_device_modal: false,
            selected_recipe: {},
            selected_recipe_json: {},
            devices: [],
            selected_device_uuid: '',
            selected_recipe_uuid: ''
        };

        this.toggle = this.toggle.bind(this);
        this.getAllRecipes = this.getAllRecipes.bind(this)
        this.toggle_apply_to_device = this.toggle_apply_to_device.bind(this);
        this.apply_to_device = this.apply_to_device.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.goToRecipe = this.goToRecipe.bind(this);
    }

    editRecipe(recipe_id) {
        window.location.href = '/new_recipe/' + recipe_id.toString()
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

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        }, () => {
            // console.log("State", this.state);
        });
        event.preventDefault();

    }

    onFilterRecipe = (type) => {
        this.setState({filter_recipe_button_state: type});
    }

    goToRecipe(value, e) {
        console.log(value)
        console.log(e)
        window.location.href = "/recipe_details/" + (value).toString()
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

    toggle_apply_to_device(recipe_uuid) {
        this.setState({
            apply_to_device_modal: !this.state.apply_to_device_modal,
            selected_recipe_uuid: recipe_uuid
        })
    }

    getAllRecipes() {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_all_recipes/', {
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
                console.log(responseJson);
                if (responseJson['response_code'] == 200) {
                    this.setState({devices: responseJson['devices']})

                    const own_uuid = responseJson['user_uuid'];
                    const all_recipes = responseJson['results'];

                    let recipes_map = new Map();
                    let filtered_map = new Map();

                    // Filter recipes into filtered_recipes, put all into all_recipes
                    for (const recipe of all_recipes) {
                        if (recipe.user_uuid == own_uuid) {
                            filtered_map.set(recipe.recipe_uuid, recipe);
                        }
                        recipes_map.set(recipe.recipe_uuid, recipe);
                    }

                    this.setState({
                        all_recipes: recipes_map,
                        filtered_recipes: filtered_map,
                    });

                    const devices = responseJson['devices'];
                    if (devices) {
                        // default the selected device to the first/only dev.
                        this.state.selected_device_uuid = devices[0].device_uuid;
                    }
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    apply_to_device() {
        console.log(JSON.stringify({
            'device_uuid': this.state.selected_device_uuid,
            'recipe_uuid': this.state.selected_recipe_uuid,
            'user_token': this.props.cookies.get('user_token')
        }))
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/apply_to_device/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'device_uuid': this.state.selected_device_uuid,
                'recipe_uuid': this.state.selected_recipe_uuid,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    console.log("Applied successfully")
                    this.setState({apply_to_device_modal: false});
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    onStarRecipe = (recipe_uuid) => {
        api.starRecipe(
            this.props.cookies.get('user_token'),
            recipe_uuid
        ).then(response => {
            console.log(`Recipe: ${recipe_uuid} starred.`);
            this.toggleStar(recipe_uuid);
        }).catch(response => {
            console.error(response.message);
        });
    }

    onUnstarRecipe = (recipe_uuid) => {
        api.unstarRecipe(
            this.props.cookies.get('user_token'),
            recipe_uuid
        ).then(response => {
            console.log(`Recipe: ${recipe_uuid} unstarred.`);
            this.toggleStar(recipe_uuid);
        }).catch(response => {
            console.error(response.message);
        });
    }

    toggleStar = (recipe_uuid) => {
        const recipes_map = new Map(this.state.all_recipes);
        const recipe = recipes_map.get(recipe_uuid);
        recipe.starred = !recipe.starred;
        recipes_map.set(recipe_uuid, recipe);

        const filtered_map = new Map(this.state.filtered_recipes);
        const recipe_filtered = filtered_map.get(recipe_uuid);
        if (recipe_filtered) {
            recipe_filtered.starred = !recipe_filtered.starred;
            filtered_map.set(recipe_uuid, recipe_filtered);
        }

        console.log(recipes_map);

        this.setState({
            all_recipes: recipes_map,
            filtered_recipes: filtered_map
        });
    }

    render() {
        let listRecipes = <p>Loading</p>
        let recipes = [];
        if (this.state.all_recipes.size) {
            switch (this.state.filter_recipe_button_state) {
                case 'my':
                    recipes = [...this.state.filtered_recipes.values()];
                    break;
                case 'starred':
                    recipes = [...this.state.all_recipes.values()].filter(recipe =>
                        recipe.starred
                    )
                    break;
                default:
                    recipes = [...this.state.all_recipes.values()]
            }

            listRecipes = recipes.map((recipe) =>
                <RecipeCard
                    key={recipe.recipe_uuid}
                    recipe={recipe}
                    onSelectRecipe={this.goToRecipe}
                    onStarRecipe={this.onStarRecipe}
                    onUnstarRecipe={this.onUnstarRecipe}
                />
            );
        }
        return (
            <Router>
                <div className="recipe-container">
                    <div className="buttons-row">
                        <ButtonGroup>
                            <Button
                                outline
                                onClick={() => this.onFilterRecipe('all')}
                                active={this.state.filter_recipe_button_state == 'all'}
                                color="primary"
                            >
                                All Recipes
                            </Button>
                            <Button
                                outline
                                onClick={() => this.onFilterRecipe('my')}
                                active={this.state.filter_recipe_button_state == 'my'}
                                color="primary"
                            >
                                My Recipes
                            </Button>
                            <Button
                                outline
                                onClick={() => this.onFilterRecipe('starred')}
                                active={this.state.filter_recipe_button_state == 'starred'}
                                color="primary"
                            >
                                Starred Recipes
                            </Button>
                        </ButtonGroup>
                    </div>
                    <div className="recipe-cards">
                        <div className="card recipe-card">
                            {/*<img className="recipe-image" src="http://via.placeholder.com/200x200"/>*/}
                            <div className="card-body">
                                <h5 className="card-title">New Recipe</h5>
                                <h6 className="card-subtitle mb-2 text-muted"></h6>
                                <div className="card-text">Use this template recipe to create your custom
                                    recipes
                                </div>
                            </div>
                            <div className="card-footer">
                                <Button
                                    onClick={this.editRecipe.bind(this, '0')}
                                    className="button-card-link"
                                >
                                    Create Recipe
                                </Button>
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

                    <Modal isOpen={this.state.apply_to_device_modal} toggle={this.toggle_apply_to_device}
                           className={this.props.className}>
                        <ModalHeader toggle={this.toggle_apply_to_device}>Select a device to apply this recipe
                            to </ModalHeader>
                        <ModalBody>
                            <select className="form-control smallInput" onChange={this.handleChange}
                                    id="selected_device_uuid" name="selected_device_uuid"
                                    value={this.selected_device_uuid}>
                                {this.state.devices.map(function (device) {
                                    return <option key={device.device_uuid}
                                                   value={device.device_uuid}>{device.device_name}</option>
                                })}
                            </select>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.apply_to_device}>Apply to this device</Button>
                            <Button color="secondary" onClick={this.toggle_apply_to_device}>Close</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </Router>

        );
    }
}

export default withCookies(recipes);
