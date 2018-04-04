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
        this.state = {
            user_token: props.cookies.get('user_token') || ''
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClear = this.handleClear.bind(this);
        this.buildForm = this.buildForm.bind(this);
        this.getRecipeComponents = this.getRecipeComponents.bind(this);
        this.timePickerChange = this.timePickerChange.bind(this);
    }

    componentDidMount() {
        console.log("Mounting component")
        this.getRecipeComponents()
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
                'recipe_id': '0'
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let components = responseJson["results"]

                    this.buildForm(components)
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    timePickerChange(name, value) {
        this.setState({
            [name]:value.format('hh:mm')
        }, () => {
            console.log("New state in ASYNC callback:", this.state);
        });
    }


    createInputFields(fields_json, component_key, component_description) {

        var list_of_fields = fields_json.map((field_json) => {
            if (field_json["type"] === "publisherPair") {
                return (

                    <div className="card temp-card" key={component_key}>
                        <div className="card-body">
                            <div className="row">{field_json["label"]}
                                <div className="col-md-6">
                                    <div className="smallInput"><Input type="text"
                                                                       name={component_key + '_time'}
                                                                       id={component_key + '_time'}
                                                                       placeholder=""
                                                                       value={this.state[component_key + '_time']}
                                                                       onChange={this.handleChange}/>

                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <select className="form-control smallInput" name={component_key + '_unit'}
                                            id={component_key + '_unit'} value={this.state[component_key + '_unit']}
                                            onChange={this.handleChange}>
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
                return (<div>
                    <div className="card-title">{field_json["label"]}</div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="smallInput"> from
                                    <TimePicker
                                        name={field_json["key"] + "_from"}
                                        id={field_json["key"] + "_from"}
                                        showSecond={false}
                                        defaultValue={now}
                                        className="xxx"
                                        onChange={this.timePickerChange.bind(null, field_json["key"] + "_from")}
                                        format={format}
                                        use12Hours
                                        inputReadOnly
                                    /></div>
                            </div>
                            <div className="col-md-6">
                                <div className="smallInput"> to
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
                </div>)
            }

            if (field_json["type"] === "color_panel_led") {
                var all_color_inputs = []

                var colors_array = ["far_red", "red", "warm_white", "cool_white", "blue", "green"]
                for (let color of colors_array) {
                    let color_name = color.replace("_", " ")
                    let colorInput = <div className="card-body">
                        <div className="row">{color_name[0].toUpperCase() + color_name.substr(1)}
                            <div className="col-md-6">
                                <div className="smallInput"><Input type="text"
                                                                   name={field_json["key"] + "_" + color}
                                                                   id={field_json["key"] + "_" + color}
                                                                   placeholder=""
                                                                   value={this.state[field_json["key"] + "_" + color]}
                                                                   onKeyUp={this.handleChange}/>

                                </div>
                            </div>
                        </div>
                    </div>
                    all_color_inputs.push(colorInput)
                }
                return (all_color_inputs)
            }
        });

        return list_of_fields

    }

    buildForm(components) {
        var container = this.refs.container;
        var cards = []
        for (let component of components) {
            let fields_json = JSON.parse(component["fields_json"])
            cards.push(<h6>{component['component_description']}</h6>)
            cards.push(this.createInputFields(fields_json, component["component_name"], component["component_description"]));
        }
        ReactDOM.render(<div>{cards}</div>, container);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        }, () => {
            console.log("New state in ASYNC callback:", this.state);
        });
        event.preventDefault();

    }

    handleSubmit(event) {

        console.log('A recipe edit form was submitted');
        console.log(this.state)
        event.preventDefault();
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

        return <div className="recipe-container" ref="container"/>;
    }
}

export default withCookies(EditRecipe);
