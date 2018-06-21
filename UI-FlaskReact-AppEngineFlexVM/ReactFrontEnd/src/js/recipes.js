import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from "react-router-dom";
import '../css/recipes.css';
import {Cookies, withCookies} from "react-cookie";
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

class recipes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            all_recipes: [],
            filtered_recipes: [],
            filter_recipe_button_state: 'my',
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
        return fetch( process.env.REACT_APP_FLASK_URL + '/api/get_all_recipes/', {
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
                    this.setState({devices: responseJson["devices"]})

                    // Filter recipes
                    const own_uuid = responseJson["user_uuid"];
                    const all_recipes = responseJson["results"];
                    const filtered_recipes = all_recipes.filter(recipe =>
                        recipe.user_uuid == own_uuid
                    )

                    this.setState({
                        all_recipes: all_recipes,
                        filtered_recipes, filtered_recipes,
                        user_uuid: own_uuid
                    });

                    var devs = [];                  // make array
                    devs = responseJson["devices"]; // assign array
                    if (devs.length > 0) {         // if we have devices
                        // default the selected device to the first/only dev.
                        this.state.selected_device_uuid = devs[0].device_uuid;
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
        return fetch( process.env.REACT_APP_FLASK_URL + '/api/apply_to_device/', {
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

render() {
    let listRecipes = <p>Loading</p>
    let recipes = [];
    if (this.state.all_recipes.length > 0) {
        if (this.state.filter_recipe_button_state == 'my') {
            recipes = this.state.filtered_recipes;
        } else {
            recipes = this.state.all_recipes;
        }

        listRecipes = recipes.map((recipe) => {
            return <div className="col-md-3" key={recipe.recipe_uuid}>
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">{recipe.name}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">{recipe.description}</h6>
                        <div className="card-text">

                            <div onClick={this.goToRecipe.bind(this, recipe.recipe_uuid)} id={recipe.recipe_uuid}
                            >View Recipe
                            </div>
                            <div onClick={this.toggle_apply_to_device.bind(this, recipe.recipe_uuid)}
                                 id={recipe.recipe_uuid}>Apply Recipe
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
                <div className="row buttons-row">
                    <div className="button__group">
                        <a
                            href="javascript:void(0)"
                            className={`
                                button button__toggle
                                ${this.state.filter_recipe_button_state == 'all' && 'button-selected'}
                            `}
                            onClick={() => this.onFilterRecipe('all')}
                        >
                            All Climate Recipes
                        </a>
                        <a
                            href="javascript:void(0)"
                            className={`
                                button button__toggle
                                ${this.state.filter_recipe_button_state == 'my' && 'button-selected'}
                            `}
                            onClick={() => this.onFilterRecipe('my')}
                        >
                            My Climate Recipes
                        </a>
                        </div>
                    </div>
                    <div className="row card-row">
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">New Recipe</h5>
                                    <h6 className="card-subtitle mb-2 text-muted"></h6>
                                    <div className="card-text">Use this template recipe to create your custom recipes
                                    </div>
                                    <div className="card-text">
                                        <div onClick={this.editRecipe.bind(this, '0')}
                                             className="card-link"> Create Recipe
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
