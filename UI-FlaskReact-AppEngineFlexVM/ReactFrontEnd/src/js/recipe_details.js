import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import Tooltip from 'rc-tooltip';
import 'rc-time-picker/assets/index.css';
import {Button, Input, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';
import "../scss/recipe_detail.scss";
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import Slider from 'rc-slider';
import basil from '../images/basil.jpg'
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
            standard_day_duration:"",
            standard_night_duration:"",
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
                    this.setState({standard_day_duration:resultJson["recipe_json"]["phases"][0]["cycles"][0]["duration_hours"]})
                    this.setState({standard_night_duration:resultJson["recipe_json"]["phases"][0]["cycles"][1]["duration_hours"]})

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
                    <li key={component.type}>
                        {component.name}
                    </li>
                )
            }
        });

        return (
            <div className="recipe-detail-container">
                <div className="row">
                    <div className="col-md-4">
                        <a href="/recipes" className="goback-text"> Back to climate recipes</a>
                    </div>
                </div>
                <div className="row home-row">
                    <div className="col-md-3">
                        <div className="row card-row"></div>
                        <div className="row card-row image-row">
                            <img src={basil} className="image-recipe" height="500"/>
                        </div>
                    </div>

                    <div className="col-md-9 add-padding">

                        <div className="row card-row">
                            <div className="col-md-12 "><h3>{this.state.recipe_name} for {this.state.recipe_plant} </h3>
                            </div>
                        </div>

                        <div className="row card-row ">

                            <div className="col-md-12">
                                <div className="card recipe-description-row">
                                    <div className="card-body ">
                                        <div className="card-text">
                                            {this.state.recipe_description}
                                        </div>
                                    </div>
                                </div>
                                <div className="row home-row">
                                    <div className="col-md-12"><h3>Settings </h3></div>

                                </div>
                                <div className="row home-row">
                                    <div className="col-md-12">
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="card-title"><h4></h4></div>
                                                <div className="card-text">
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">LED Spectrum for standard day</div>
                                                        <div
                                                            className="col-md-4">{this.state.led_panel_dac5578["on_selected_spectrum"].toUpperCase()}
                                                            Spectrum
                                                        </div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">LED illumination distance for standard
                                                            day
                                                        </div>
                                                        <div
                                                            className="col-md-4">{this.state.led_panel_dac5578["on_illumination_distance"]}
                                                            cm
                                                        </div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">LED Spectrum for standard night</div>
                                                        <div
                                                            className="col-md-4">{this.state.led_panel_dac5578["off_selected_spectrum"].toUpperCase()}
                                                            Spectrum
                                                        </div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">LED illumination distance for standard
                                                            night
                                                        </div>
                                                        <div
                                                            className="col-md-4">{this.state.led_panel_dac5578["off_illumination_distance"]}
                                                            cm
                                                        </div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">Standard night</div>
                                                        <div className="col-md-4">{this.state.standard_night_duration} hours</div>
                                                        <div className="col-md-2"></div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">Standard day</div>
                                                        <div className="col-md-4">{this.state.standard_day_duration} hours</div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row home-row">
                                    <div className="col-md-12"><h3>Desired Environment </h3></div>

                                </div>
                                <div className="row home-row">
                                    <div className="col-md-12">
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="card-title"><h4></h4></div>
                                                <div className="card-text">
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">Temperature Set Point</div>
                                                        <div className="col-md-4">25 (<sup>o</sup>C) Celsius</div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">Humidity Set Point</div>
                                                        <div className="col-md-4">65 (%) Percent</div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-2"></div>
                                                        <div className="col-md-4">CO2 Set Point</div>
                                                        <div className="col-md-4">450 <sup>o</sup>ppm (Parts per million)
                                                        </div>
                                                        <div className="col-md-2"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>


                <div className="row home-row">
                    <div className="col-md-8">
                    </div>
                    <div className="col-md-4 color-button">
                        <button className="apply-button btn btn-secondary" onClick={this.toggleApplyToDevice}>
                            Download & Run
                        </button>
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
