import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import "../css/recipe_details.css";
import arugula from "../images/arugula.jpg";
import '../css/new_recipe.css';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-time-picker/assets/index.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

const showSecond = true;
const str = showSecond ? 'HH:mm:ss' : 'HH:mm';
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

class RecipeDetails extends Component {
    constructor(props) {
        super(props);
        this.recipe_uuid = this.props.location.pathname.replace("/recipe_details/", "").replace("#", "")
        this.state = {
            recipe_name: "",
            recipe_description: "",
            recipe_plant: "",
            recipe_uuid: this.recipe_uuid,
            recipe_json: {},
            peripherals: [],
            history: {},
            devices:[],
            apply_to_device_modal: false
        };
        this.getRecipeDetails = this.getRecipeDetails.bind(this);
        this.toggle_apply_to_device = this.toggle_apply_to_device.bind(this);
        this.handleChange = this.handleChange.bind(this);

    }
    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        }, () => {
            // console.log("State", this.state);
        });
        event.preventDefault();

    }
    componentDidMount() {
        this.getRecipeDetails()
    }

    toggle_apply_to_device(recipe_uuid) {
        this.setState({
            apply_to_device_modal: !this.state.apply_to_device_modal,
            selected_recipe_uuid: recipe_uuid
        })
    }

    getRecipeDetails() {
        return fetch(process.env.REACT_APP_FLASK_URL + "/api/get_recipe_by_uuid/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'recipe_uuid': this.state.recipe_uuid,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let resultJson = responseJson["results"][0]
                    this.setState({recipe_name: resultJson["name"]})
                    this.setState({recipe_description: resultJson["description"]})
                    this.setState({recipe_plant: resultJson["plant_type"]})
                    this.setState({modified_at: resultJson["modified_at"]})
                    this.setState({recipe_json: resultJson["recipe_json"]})
                    this.setState({peripherals: (resultJson["peripherals"])})
                    this.setState({devices: responseJson["devices"]})

                    var devs = [];                  // make array
                    devs = responseJson["devices"]; // assign array
                    if (devs.length > 0) {         // if we have devices
                        // default the selected device to the first/only dev.
                        this.state.selected_device_uuid = devs[0].device_uuid;
                    }

                    // this.setState({history: responseJson["history"]})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }


    render() {
        let flatten = function (arr) {
            return arr.reduce(function (flat, toFlatten) {
                return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
            }, []);
        };
        let listperipherals = this.state.peripherals.map((component) => {
            return (<div className="row" key={component.type}>
                <div className="col-md-6">
                    {component.name}
                </div>

            </div>)

        });

        let recipeParams = this.state.peripherals.map(function (peripheral_json) {

            if (peripheral_json) {
                let peripheral_html = []
                peripheral_html.push(<div className="row label-row">
                    <div className="col-md-6 rounded-col" style={{backgroundColor: peripheral_json.color}}>
                        {peripheral_json.name}
                    </div>
                </div>)
                // Get all the input fields needed to load required fields for this peripheral
                let fields = JSON.parse(peripheral_json.inputs)
                for (let field of fields) {
                    if (field.field_type === "text_input") {
                        peripheral_html.push(
                            <div className="row field-row">
                                <span>Sensor values are published every time environment changes </span>
                            </div>)

                    }
                    if (field.field_type === "led_panel") {

                        peripheral_html.push(<div className="row">
                                <div className="col-md-6">
                                    <div className="card led-stats-card">
                                        <div className="card-block">
                                            <h4 className="card-title "> Choose LED Spectrum for Standard Day </h4>
                                            <div className="card-text">
                                                <div className="graph">
                                                    <div className="">
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Cool White</span>
                                                            </div>
                                                            <div className="col-md-6">

                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_cool_white']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Warm White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_warm_white']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Blue</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_blue']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Green</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_green']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_red']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Far Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_far_red']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>


                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card led-stats-card">
                                        <div className="card-block">
                                            <h4 className="card-title "> Choose LED Spectrum for Standard Night </h4>
                                            <div className="card-text">
                                                <div className="graph">
                                                    <div className="">
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Cool White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_cool_white']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Warm White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_warm_white']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Blue</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_blue']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Green</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_green']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_red']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Far Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_far_red']}
                                                                        handle={handle}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>


                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                }
                return peripheral_html
            }
        }, this);
        return (
            <div className="home-container">
                <div className="row">
                    <div className="col-md-4">
                        <a href="/recipes"> Back to climate recipes</a>
                    </div>
                </div>
                <div className="row home-row">
                    <div className="col-md-3 img-col">
                        <img src={arugula}/>
                    </div>

                    <div className="col-md-9">

                        <div className="row card-row">
                            <h3>{this.state.recipe_name} for {this.state.recipe_plant} </h3>
                        </div>

                        <div className="row card-row">

                            <div className="col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="card-text">
                                            {this.state.recipe_description}
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>
                        <div className="row card-row">

                            <h3>Peripherals used in this climate recipe </h3>

                        </div>
                        <div className="row card-row">
                            <div className="col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        {/*<div className="card-title"></div>*/}
                                        <div className="card-text">
                                            {listperipherals}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row card-row">

                            <h3>Parameters of the Climate Recipe </h3>

                        </div>
                        <div className="row card-row">
                            <div className="col-md-12">


                                {recipeParams}


                            </div>
                        </div>
                        <div className="row card-row">
                            <div onClick={this.toggle_apply_to_device.bind(this, this.recipe_uuid)}
                                 id={this.recipe_uuid}>Apply Recipe
                            </div>
                        </div>

                    </div>


                </div>
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

        )
    }
}

export default withCookies(RecipeDetails);
