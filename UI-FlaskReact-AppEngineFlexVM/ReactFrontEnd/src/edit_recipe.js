import React, {Component} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import './edit_recipe.css';
import {Form, FormGroup, Input} from 'reactstrap';
import ReactDOM from 'react-dom';
import {Cookies, withCookies} from "react-cookie";
import moment from 'moment';
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';

const format = 'h:mm a';

const now = moment().hour(0).minute(0);

class EditRecipe extends Component {

    constructor(props) {
        super(props);
        this.template_recipe_uuid = this.props.location.pathname.replace("/edit_recipe/","").replace("#","")
        this.state = {}
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            components:[],
            template_recipe_uuid:this.template_recipe_uuid
        };
        this.recipe_json = {}
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClear = this.handleClear.bind(this);
        this.buildForm = this.buildForm.bind(this);
        this.getRecipeComponents = this.getRecipeComponents.bind(this);
        this.timePickerChange = this.timePickerChange.bind(this);
        this.saveRecipe = this.saveRecipe.bind(this);
    }

    componentDidMount() {
        console.log("Mounting component")
          this.getRecipeComponents()

    }
    componentWillMount() {
        if (this.props.cookies.get('user_token') === '' || this.props.cookies.get('user_token') === undefined || this.props.cookies.get('user_token') === "undefined") {
            window.location.href = "/login"
        }

    }
    getRecipeComponents() {
        return fetch('http://food.computer.com:5000/api/get_recipe_components/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'recipe_id': this.state.template_recipe_uuid
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let components = responseJson["results"]
                    this.recipe_json = JSON.parse(responseJson["recipe_json"])


                    for(let component of components)
                    {
                        this.state.components.push(component["component_id"].toString())
                    }
                    console.log(this.state.components,"Components on page")
                    this.buildForm(components)
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    timePickerChange(name, value) {
        this.setState({
            [name]: value.format('hh:mm')
        }, () => {
            // console.log("State", this.state);
        });
    }


    createInputFields(fields_json, component_key, component_description) {

        var list_of_fields = fields_json.map((field_json) => {
            if (field_json["type"] === "publisherPair") {
                return (
                    <div className="row field-row" key={component_key}>
                        <div className="col-md-3">
                            {field_json["label"]}
                        </div>
                        <div className="col-md-9">
                            <div className="row">

                                <div className="smallInput"><Input type="number"
                                                                   name={component_key + '_time'}
                                                                   id={component_key + '_time'}
                                                                   placeholder=""
                                                                   value={this.state[component_key + '_time']}
                                                                   onChange={this.handleChange} defaultValue={this.recipe_json[component_key + '_time']}/>


                                </div>

                                <div className="col-md-6">
                                    <select className="form-control smallInput" name={component_key + '_unit'}
                                            id={component_key + '_unit'} value={this.state[component_key + '_unit']}
                                            onChange={this.handleChange} defaultValue={this.recipe_json[component_key + '_unit']}>
                                        <option value="seconds">Seconds</option>
                                        <option value="minutes">Minutes</option>
                                        <option value="hours">Hours</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            if (field_json["type"] === "timerPair") {
                return (
                    <div className="row field-row" key={component_key}>
                        <div className="col-md-3">
                            {field_json["label"]}
                        </div>
                        <div className="col-md-9">
                            <div className="row">

                                <div className="smallInput"><TimePicker
                                    name={field_json["key"] + "_from"}
                                    id={field_json["key"] + "_from"}
                                    showSecond={false}
                                    defaultValue={now}
                                    className="xxx"
                                    onChange={this.timePickerChange.bind(null, field_json["key"] + "_from")}
                                    format={format}
                                    use12Hours
                                    inputReadOnly
                                />


                                </div>
                                <div>
                                    to
                                </div>
                                <div className="col-md-6">
                                    <TimePicker
                                        name={field_json["key"] + "_to"}
                                        id={field_json["key"] + "_to"}
                                        showSecond={false}
                                        defaultValue={now}
                                        className="xxx"
                                        onChange={this.timePickerChange.bind(null, field_json["key"] + "_to")}
                                        format={format}
                                        use12Hours
                                        inputReadOnly
                                    /></div>
                            </div>
                        </div>
                    </div>


                )
            }

            if (field_json["type"] === "color_panel_led") {
                var all_color_inputs = []
                var colors_array = ["far_red", "red", "warm_white", "cool_white", "blue", "green"]
                for (let color of colors_array) {
                    let color_name = color.replace("_", " ")
                    let colorInput =


                            <div className="colorInput" key={field_json["key"] + "_" + color}>{color_name[0].toUpperCase() + color_name.substr(1)}<Input type="number"
                                                               name={field_json["key"] + "_" + color}
                                                               id={field_json["key"] + "_" + color}
                                                               placeholder="(0-255)"
                                                               defaultValue={this.recipe_json[field_json["key"] + "_" + color]}
                                                               value={this.state[field_json["key"] + "_" + color]}
                                                               min='0'
                                                               max='255'
                                                               onKeyUp={this.handleChange}/>

                            </div>


                    all_color_inputs.push(colorInput)
                }
                return (<div>
                    <div className="row color-field-row" key={field_json["key"]}>
                        <div className="col-md-3">
                            Set color points
                        </div>
                        <div className="col-md-9">
                            <div className="row">
                            {all_color_inputs}
                            </div>
                        </div>
                    </div>

                </div>)
            }
        });

        return list_of_fields

    }

    buildForm(components) {
        var container = this.refs.container;
        var cards = [<div key="name_parent"><div className="row field-row" key="recipe_name">
                        <div className="col-md-3">
                            <b>Name for this recipe</b>
                        </div>
                        <div className="col-md-9">
                            <div className="row">
                                <div className="bigInput"><Input type="text"
                                                                   name="recipe_name"
                                                                   id="recipe_name"
                                                                   placeholder="E.g Rob's Wasabi Arugula"
                                                                   value={this.state.recipe_name}
                                                                   defaultValue = {this.recipe_json.recipe_name}
                                                                   onChange={this.handleChange}/>


                                </div>
                            </div>
                        </div>
                    </div><hr/></div>,<div key="plant_type_parent"><div className="row field-row" key="plant_type">
                        <div className="col-md-3">
                            <b>Plant type for this recipe</b>
                        </div>
                        <div className="col-md-9">
                            <div className="row">
                                <div className="bigInput"><Input type="text"
                                                                   name="plant_type"
                                                                   id="plant_type"
                                                                   placeholder="E.g Basil, Arugula"
                                                                   value={this.state.plant_type} defaultValue = {this.recipe_json.plant_type}
                                                                   onChange={this.handleChange}/>


                                </div>
                            </div>
                        </div>
                    </div><hr/></div>]
        for (let component of components) {
            console.log(component)
            let fields_json = component["fields_json"]
            cards.push(<h6 key={component['component_description']}>{component['component_description']}</h6>)
            cards.push(this.createInputFields(fields_json, component["component_name"], component["component_description"]));
            cards.push(<hr key={component['component_name']+'_divider'}/>)
        }
        ReactDOM.render(<div key="component_cards">{cards}</div>, container);
    }


    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        }, () => {
            // console.log("State", this.state);
        });
        event.preventDefault();

    }

    handleSubmit(event) {

        console.log('A recipe edit form was submitted');
        this.saveRecipe(this.state,this.recipe_json)
        event.preventDefault();
    }

    saveRecipe(state_json,recipe_json)
    {
        let json_to_submit = {}
        Object.keys(recipe_json).forEach(function(key) {
            if(state_json[key] === undefined){
                json_to_submit[key] = recipe_json[key]
            }
            else
            {
                json_to_submit[key] = state_json[key]
            }
        });
        return fetch('http://food.computer.com:5000/api/save_recipe/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'recipe_json': JSON.stringify(json_to_submit),
                'user_token': this.props.cookies.get('user_token')
            })
           })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"]== 200){
                    console.log("Saved successfully")
                    window.location.href = "/recipes"
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    handleClear(event) {

        this.setState({
            temp_humidity_sht25: '',
            co2_t6713: '',
            cool_white: '',
            blue: '',
            green: '',
            warm_white: '',
            red: '',
            far_red: '',
            lights_on: ''

        });
        event.preventDefault();
    }

    render() {

        return (
            <div className="recipe-container">
                <div className="row title-row">
                    <h2>Let's build a recipe</h2>
                </div>
                <hr/>
                <div className="spacer"></div>

                <div ref="container"/>
                <a className="buttona" href="#" onClick={this.handleSubmit}>Submit Recipe</a>
            </div>);
    }
}

export default withCookies(EditRecipe);
