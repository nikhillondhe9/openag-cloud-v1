import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import "../css/recipe_details.css";
import '../css/new_recipe.css';
import Tooltip from 'rc-tooltip';
import 'rc-time-picker/assets/index.css';
import {Button, Input, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';

import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import Slider from 'rc-slider';

import {DeviceIsRunningModal} from './components/device_is_running_modal';

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
                'on_cool_white': '',
                'on_warm_white': '',
                'on_blue': '',
                'on_green': '',
                'on_red': '',
                'on_far_red': '',
                'off_cool_white': '',
                'off_warm_white': '',
                'off_blue': '',
                'off_green': '',
                'off_red': '',
                'off_far_red': ''
            },
            apply_to_device_modal: false,
            apply_confirmation_modal: false
        };
        this.getRecipeDetails = this.getRecipeDetails.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
        event.preventDefault();

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
        fetch(process.env.REACT_APP_FLASK_URL + '/api/device_is_running_recipe/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_uuid': this.state.selected_device_uuid
            })
        })
            .then(response => response.json())
            .then(response => {
                // If is running
                if (response.result) {
                    // Close first modal and open the second.
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

                    let led_data = {
                        'on_cool_white': standard_day['light_spectrum_nm_percent']['400-449'],
                        'on_warm_white': standard_day['light_spectrum_nm_percent']['450-499'],
                        'on_blue': standard_day['light_spectrum_nm_percent']['500-549'],
                        'on_green': standard_day['light_spectrum_nm_percent']['550-599'],
                        'on_red': standard_day['light_spectrum_nm_percent']['600-649'],
                        'on_far_red': standard_day['light_spectrum_nm_percent']['650-699'],
                        'on_illumination_distance': standard_day['light_illumination_distance_cm'],
                        'off_cool_white': standard_night['light_spectrum_nm_percent']['400-449'],
                        'off_warm_white': standard_night['light_spectrum_nm_percent']['450-499'],
                        'off_blue': standard_night['light_spectrum_nm_percent']['500-549'],
                        'off_green': standard_night['light_spectrum_nm_percent']['550-599'],
                        'off_red': standard_night['light_spectrum_nm_percent']['600-649'],
                        'off_far_red': standard_night['light_spectrum_nm_percent']['650-699'],
                        'off_illumination_distance': standard_day['light_illumination_distance_cm']
                    }
                    this.setState({
                        led_panel_dac5578: led_data
                    })
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
                                                            <div className="col-md-4">
                                                                <span>Cool White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['on_cool_white']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['on_cool_white']}
                                                            </div>
                                                        </div>

                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span>Warm White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['on_warm_white']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['on_warm_white']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span>Blue</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['on_blue']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['on_blue']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span> Green </span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['on_green']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['on_green']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span> Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['on_red']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['on_red']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span>Far Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['on_far_red']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['on_far_red']}
                                                            </div>
                                                        </div>


                                                    </div>


                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <span>Illumination Distance (in <i>cm</i>)</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={19}
                                                            value={this.state['led_panel_dac5578']['on_illumination_distance']}
                                                            handle={handle}/>
                                                </div>
                                                <div className="col-md-2">
                                                    {this.state['led_panel_dac5578']['on_illumination_distance']} cm
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
                                                            <div className="col-md-4">
                                                                <span>Cool White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['off_cool_white']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['off_cool_white']}
                                                            </div>
                                                        </div>

                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span>Warm White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['off_warm_white']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['off_warm_white']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span>Blue</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['off_blue']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['off_blue']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span> Green </span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['off_green']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['off_green']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span> Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider

                                                                    min={0} max={100}
                                                                    value={this.state['led_panel_dac5578']['off_red']}
                                                                    handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['off_red']}
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-4">
                                                                <span>Far Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={100}
                                                                        value={this.state['led_panel_dac5578']['off_far_red']}
                                                                        handle={handle}/>
                                                            </div>
                                                            <div className="col-md-2">
                                                                {this.state['led_panel_dac5578']['off_far_red']}
                                                            </div>
                                                        </div>


                                                    </div>


                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <span>Illumination Distance (in <i>cm</i>)</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={19}
                                                            value={this.state['led_panel_dac5578']['off_illumination_distance']}
                                                            handle={handle}/>
                                                </div>
                                                <div className="col-md-2">
                                                    {this.state['led_panel_dac5578']['off_illumination_distance']} cm
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
                        <img src={this.state.recipe_image}/>
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
                            <Button onClick={this.toggleApplyToDevice}>
                                Apply Recipe
                            </Button>
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
