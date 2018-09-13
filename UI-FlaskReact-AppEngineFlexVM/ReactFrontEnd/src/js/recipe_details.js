import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import Tooltip from 'rc-tooltip';
import 'rc-time-picker/assets/index.css';
import {Button, Input, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';
import "../scss/recipe_detail.scss";
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import Slider from 'rc-slider';

import {DeviceIsRunningModal} from './components/device_is_running_modal';
import {LEDSpectrumOptions} from "./components/led_spectrum_options";

import * as api from './utils/api';

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
            recipe_image: '',
            recipe_description: "",
            recipe_plant: "",
            recipe_uuid: this.recipe_uuid,
            recipe_json: {},
            peripherals: [],
            history: {},
            devices: [],
            led_panel_dac5578: {
                'on_illumination_distance': 5,
                'off_illumination_distance': 5,
                'off_selected_spectrum': "flat",
                "on_selected_spectrum": "flat",
            },
            apply_to_device_modal: false,
            apply_confirmation_modal: false
        };
        this.getRecipeDetails = this.getRecipeDetails.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.LEDPanelChange = this.LEDPanelChange.bind(this);
        this.LEDSpectrumSelection = this.LEDSpectrumSelection.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
        event.preventDefault();

    }

    LEDPanelChange(led_data_type, color_channel, value) {

        console.log("View Only")

    }

    LEDSpectrumSelection(led_data_type, color_channel, spectrum_type, value) {

        console.log("View Only")

    }

    componentDidMount() {
        this.getRecipeDetails();
    }

    toggleApplyToDevice = () => {
        this.setState(prevState => ({
            apply_to_device_modal: !prevState.apply_to_device_modal,
        }));
    }

    toggleApplyConfirmation = () => {
        this.setState(prevState => ({
            apply_confirmation_modal: !prevState.apply_confirmation_modal
        }));
    }

    applyToDevice = () => {
        console.log(`Recipe ${this.state.recipe_uuid} applied to device...`);

        fetch(process.env.REACT_APP_FLASK_URL + '/api/apply_recipe_to_device/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_uuid': this.state.selected_device_uuid,
                'recipe_uuid': this.state.recipe_uuid
            })
        })
            .then(response => response.json())
            .then(response => {
                console.log(response)
                // If is running
                if (this.state.apply_confirmation_modal) {
                    this.setState({
                        apply_confirmation_modal: false
                    });
                }
            });
    };

    checkApply = () => {
        api.getCurrentRecipeInfo(
            this.props.cookies.get('user_token'),
            this.state.selected_device_uuid
        ).then(response => {

            // If is running recipe
            if (!response.expired) {
                this.toggleApplyToDevice();
                this.toggleApplyConfirmation();
            } else {
                this.applyToDevice();
                this.toggleApplyToDevice();
            }
        });
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
                    this.setState({recipe_image: resultJson["image_url"]})
                    this.setState({recipe_description: resultJson["description"]})
                    this.setState({recipe_plant: resultJson["plant_type"]})
                    this.setState({modified_at: resultJson["modified_at"]})
                    this.setState({recipe_json: resultJson["recipe_json"]})
                    this.setState({peripherals: (resultJson["peripherals"])})
                    this.setState({devices: responseJson["devices"]})
                    let standard_day = resultJson["recipe_json"]['environments']['standard_day']
                    let standard_night = resultJson["recipe_json"]['environments']['standard_night']
                    console.log(standard_day)
                    let led_data = {
                        'on_illumination_distance': standard_day['light_illumination_distance_cm'],
                        "off_selected_spectrum": standard_night["spectrum_key"],
                        "on_selected_spectrum": standard_day["spectrum_key"],
                        'off_illumination_distance': standard_day['light_illumination_distance_cm']
                    };
                    this.setState({
                        led_panel_dac5578: led_data
                    })
                    console.log(led_data, "FF")
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
        let actuators_html = []
        let sensors_html = []
        let listperipherals = this.state.peripherals.map((component) => {
            if (component.name.includes("Actuator") == true) {
                actuators_html.push(
                    <li key={component.type}>
                        {component.name}
                    </li>

                )
            }
            if (component.name.includes("Sensor") == true) {
                sensors_html.push(
                    <li  key={component.type}>
                        {component.name}
                    </li>

                )
            }
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
                                    <LEDSpectrumOptions led_panel_dac5578={this.state.led_panel_dac5578}
                                                        onLEDPanelChange={(led_name, color_channel, value) => this.LEDPanelChange(led_name, color_channel, value)}
                                                        onLEDSpectrumSelection={(led_data_type, color_channel, spectrum_type, value) => this.LEDSpectrumSelection(led_data_type, color_channel, spectrum_type, value)}
                                                        title="LED Panel - ON" prefix="on"/>
                                </div>
                                <div className="col-md-6">
                                    <LEDSpectrumOptions led_panel_dac5578={this.state.led_panel_dac5578}
                                                        onLEDPanelChange={(led_name, color_channel, value) => this.LEDPanelChange(led_name, color_channel, value)}
                                                        onLEDSpectrumSelection={(led_data_type, color_channel, spectrum_type, value) => this.LEDSpectrumSelection(led_data_type, color_channel, spectrum_type, value)}
                                                        title="LED Panel - OFF" prefix="off"/>

                                </div>
                            </div>
                        )
                    }

                }
                return peripheral_html
            }
        }, this);
        return (
            <div className="recipe-detail-container">
                <div className="row">
                    <div className="col-md-4">
                        <a href="/recipes"> Back to climate recipes</a>
                    </div>
                </div>
                <div className="row home-row">
                    <div className="col-md-3">
                        <img src={this.state.recipe_image} className="image-recipe" width="300"/>
                    </div>

                    <div className="col-md-9">

                        <div className="row card-row">
                            <div className="col-md-12 "><h3>{this.state.recipe_name} for {this.state.recipe_plant} </h3>
                            </div>
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

                            <div className="col-md-12 "><h3>Peripherals used in this climate recipe </h3></div>

                        </div>
                        <div className="row card-row">
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="card-title">Actuators</div>
                                        <div className="card-text">
                                             <ul>

                                            {actuators_html}
                                             </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div className="col-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="card-title">Sensors</div>
                                        <div className="card-text">
                                            <ul>
                                            {sensors_html}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row card-row">

                            <div className="col-md-12 "><h3>Climate Recipe </h3></div>

                        </div>
                        <div className="row card-row">
                            <div className="col-md-12">


                                {recipeParams}


                            </div>
                        </div>
                        <div className="row card-row">
                            {/*<Button onClick={this.toggleApplyToDevice} className="submit-recipe-button">*/}
                                {/*Apply Recipe*/}
                            {/*</Button>*/}
                            <div className="col-md-10">
                            </div>
                            <div className="col-md-2">
                            <button className="apply-button btn btn-secondary" onClick={this.toggleApplyToDevice}>
                                    Download & Run
                                </button>
                            </div>
                        </div>

                    </div>


                </div>

                <Modal
                    isOpen={this.state.apply_to_device_modal}
                    toggle={this.toggleApplyToDevice}
                    className={this.props.className}
                >
                    <ModalHeader
                        toggle={this.toggleApplyToDevice}
                    >
                        Select a device to apply this recipe to
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            type="select"
                            onChange={this.handleChange} name="selected_device_uuid"
                            value={this.state.selected_device_uuid}
                        >
                            {this.state.devices.map(device =>
                                <option
                                    key={device.device_uuid}
                                    value={device.device_uuid}
                                >
                                    {device.device_name}
                                </option>
                            )}
                        </Input>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.checkApply}>Apply to this device</Button>
                        <Button color="secondary" onClick={this.toggleApplyToDevice}>Close</Button>
                    </ModalFooter>
                </Modal>
                <DeviceIsRunningModal
                    isOpen={this.state.apply_confirmation_modal}
                    toggle={this.toggleApplyConfirmation}
                    onApplyToDevice={this.applyToDevice}
                    className={this.props.className}
                />
            </div>

        )
    }
}

export default withCookies(RecipeDetails);
