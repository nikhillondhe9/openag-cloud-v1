import React, {Component} from 'react';
import '../css/edit_recipe.css';
import {Form, FormGroup, Input} from 'reactstrap';
import ReactDOM from 'react-dom';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import {Cookies, withCookies} from "react-cookie";
const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;
const handle = (props) => {
    const {value, dragging, index, ...restProps} = props;
    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={value}
            visible={dragging}
            placement="top"
            key={index}
        >
            <Handle value={value} {...restProps} />
        </Tooltip>
    );
};



class EditRecipe extends Component {

    constructor(props) {
        super(props);
        this.template_recipe_uuid = this.props.location.pathname.replace("/edit_recipe/", "").replace("#", "")
        this.state = {}
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            components: [],
            template_recipe_uuid: this.template_recipe_uuid,
            plant_description: '',
            recipe_description: '',
            plant_type: '',
            recipe_name: ''
        };
        this.recipe_json = {}
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClear = this.handleClear.bind(this);
        this.buildForm = this.buildForm.bind(this);
        this.getRecipeComponents = this.getRecipeComponents.bind(this);
        this.timePickerChange = this.timePickerChange.bind(this);
        this.saveRecipe = this.saveRecipe.bind(this);
        this.buildComponent = this.buildComponent.bind(this);
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
        return fetch("http://food.computer.com:5000/api/get_recipe_components/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'recipe_id': this.state.template_recipe_uuid,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let components = responseJson["results"]
                    this.recipe_json = JSON.parse(responseJson["recipe_json"])


                    for (let component of components) {
                        this.state.components.push(component["component_id"].toString())
                    }
                    console.log(this.state.components, "Components on page")
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


    buildComponent(component) {
        var input_field = []
        console.log("Component",component)
        if (component['field_json']['field_type'] === "led_panel") {
            input_field.push(<div key={component['field_json']['field_key']}  className=""><div className=""><p>LED ON</p><div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Cool White</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={10} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Warm White</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={220} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Blue</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={130} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Green</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={130} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Red</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={40} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Far Red</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={20} handle={handle}/>
                                                </div>
                                            </div>
                                            </div><div className=""><p>LED OFF</p><div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Cool White</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={10} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Warm White</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={220} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Blue</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={130} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Green</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={130} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Red</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={40} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Far Red</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={20} handle={handle}/>
                                                </div>
                                            </div>
                                            </div></div> )
        }
        if (component['field_json']['field_type'] === "input") {
            input_field.push(<Input key={component['field_json']['field_key']} className="form-control"
                                    id={component['field_json']['field_key']}
                                    name={component['field_json']['field_key']}
                                    onChange={this.state[component['field_json']['field_key']]}
                                    value={this.state[component['field_json']['field_key']]}
                                    defaultValue={this.state[component['field_json']['field_key']]}/>)
        }
        return (
            <div key={component['component_key']}>
                <div className="row title-row">
                    <h6>{component['component_label']}</h6>
                </div>
                <div className="row metadata-row">
                    <div className="col-md-2">
                        {component['field_json']['field_label']}
                    </div>
                    <div className="col-md-8">
                       {input_field}
                    </div>
                     <div className="col-md-2">
                       {component['field_json']['field_units']}
                    </div>
                </div>
            </div>
        )
    }

    buildForm(components) {
        var container = this.refs.container;
        var cards = []
        for (let component of components) {
            const card = this.buildComponent(component)
            cards.push(card)
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
        this.saveRecipe(this.state, this.recipe_json)
        event.preventDefault();
    }

    saveRecipe(state_json, recipe_json) {
        let json_to_submit = {}
        Object.keys(recipe_json).forEach(function (key) {
            if (state_json[key] === undefined) {
                json_to_submit[key] = recipe_json[key]
            }
            else {
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
                if (responseJson["response_code"] == 200) {
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
                <div className="row title-row">
                    <h6>BASIC PLANT INFORMATION</h6>
                </div>
                <hr/>

                <div className="row metadata-row">
                    <div className="col-md-3">
                        Recipe Name
                    </div>
                    <div className="col-md-9">
                        <Input className="form-control" type="text" name="recipe_name" id="recipe_name"
                               placeholder="E.g Rob's Wasabi Arugula"
                               value={this.state.recipe_name} defaultValue={this.recipe_json.recipe_name}
                               onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="row metadata-row">
                    <div className="col-md-3">
                        Recipe Description
                    </div>
                    <div className="col-md-9">
                        <textarea type="text" className="form-control" name="recipe_description" id="recipe_description"
                                  placeholder="Grows beautiful purple kale in 30 days in a shallow water culture hydroponic system. The lights are on a balanced spectrum and follow a standard 24 hour light cycle with 18 hour days. Moderate temperatures are maintained throughout the grow until the final harvest phase when they are radically dropped over one night to simulate a frost which makes the leaves more tender."
                                  value={this.state.recipe_description}
                                  defaultValue={this.recipe_json.recipe_description} onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="row metadata-row">
                    <div className="col-md-3">
                        Plant Type
                    </div>
                    <div className="col-md-9">
                        <Input type="text" className="form-control" name="plant_type" id="plant_type"
                               placeholder="E.g Scarlet Kale"
                               value={this.state.plant_type} defaultValue={this.recipe_json.plant_type}
                               onChange={this.handleChange}/>
                    </div>
                </div>
                <div className="row metadata-row">
                    <div className="col-md-3">
                        Plant Description
                    </div>
                    <div className="col-md-9">
                        <textarea type="text" className="form-control" name="plant_description" id="plant_description"
                                  placeholder="E.g Red veined, tightly curled purple leaves."
                                  value={this.state.plant_description} defaultValue={this.recipe_json.plant_description}
                                  onChange={this.handleChange}/>
                    </div>
                </div>
                <hr/>
                <div className="row title-row">
                    <h6>COMPONENTS ATTACHED TO THE FOOD COMPUTER</h6>
                </div>

                <hr/>
                <div id="container" ref="container"/>
                <a className="buttona" href="#" onClick={this.handleSubmit}>Submit Recipe</a>
            </div>);
    }
}

export default withCookies(EditRecipe);
