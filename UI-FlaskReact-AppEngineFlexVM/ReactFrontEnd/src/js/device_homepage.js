import React, {Component} from 'react';
import '../css/device_homepage.css';
import {Cookies, withCookies} from "react-cookie";
import * as d3 from "d3";
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import {$, jQuery} from 'jquery';
import Draggable from 'react-draggable';
import Plot from 'react-plotly.js';
import moment from 'moment';

import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import Console from 'react-console-component';
import 'react-console-component/main.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';
import FileSaver from 'file-saver';

import {DevicesDropdown} from './components/devices_dropdown';

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


const showSecond = true;
const str = showSecond ? 'HH:mm:ss' : 'HH:mm';
const displayNamesLookup = {
    "cool_white": "Cool White",
    "warm_white": "Warm White",
    "blue": "Blue",
    "far_red": "Far Red",
    "green": "Green",
    "red": "Red",
    "sensor_rh": "Relative Humidity Publish Frequency",
    "sensor_temp": "Temperature Publish Frequency",
    "sensor_co2": "CO2 Sensor Publish Frequency",
    "led_on_from": "LED ON From",
    "led_on_to": "LED ON to",
    "led_off_from": "LED OFF From",
    "led_off_to": "LED OFF To",
    "led_on_data": "LED ON",
    "led_off_data": "LED OFF"

}

class DeviceHomepage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 0,
            sensor_temp_border: "",
            sensor_co2_border: "",
            sensor_rh_border: "",
            led_on_border: "",
            led_off_border: "",
            config: {'displaylogo': false},
            current_rh: "Loading",
            current_temp: "Loading",
            current_co2: "Loading",
            sensor_co2: 60,
            sensor_temp: 60,
            sensor_rh: 60,
            rh_data: [],
            co2_data: [],
            led_on_data: {cool_white: 0, red: 0, blue: 255, green: 255, warm_white: 255, far_red: 255},
            led_off_data: {cool_white: 255, red: 255, blue: 255, green: 255, warm_white: 255, far_red: 255},
            temp_data_x: [],
            temp_data_y: [],
            co2_data_x: [],
            co2_data_y: [],
            rh_data_x: [],
            rh_data_y: [],
            led_data: [],
            temp_data: [],
            temp_layout: {title: '', width: 1, height: 1},
            led_layout: {title: '', width: 1, height: 1},
            rh_layout: {title: '', width: 1, height: 1},
            co2_layout: {title: '', width: 1, height: 1},
            show_temp_line: false,
            show_rh_line: false,
            user_devices: [],
            selected_device: 'Loading',
            recipe_name: '',
            recipe_link: '',
            modal: false,
            add_device_modal: false,
            add_access_modal: false,
            changes: {},
            control_level: 'view'
        };
        this.child = {
            console: Console
        };
        this.changes = {led_on_data: {}, led_off_data: {}}
        this.getUserDevices = this.getUserDevices.bind(this);
        this.getCurrentStats = this.getCurrentStats.bind(this);
        this.getTempDetails = this.getTempDetails.bind(this);
        this.getCO2Details = this.getCO2Details.bind(this);
        this.toggleRHData = this.toggleRHData.bind(this);
        this.toggleTempData = this.toggleTempData.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);
        this.toggleAccessCode = this.toggleAccessCode.bind(this);
        this.modalToggle = this.modalToggle.bind(this);
        this.addDeviceModalToggle = this.addDeviceModalToggle.bind(this);
        this.onSelectDevice = this.onSelectDevice.bind(this);
        this.onAddDevice = this.onAddDevice.bind(this);
        this.onAddAccessCode = this.onAddAccessCode.bind(this);
        this.sensorOnChange = this.sensorOnChange.bind(this);
        this.echo = this.echo.bind(this);
        this.sliderChange = this.sliderChange.bind(this);
        this.applyChanges = this.applyChanges.bind(this);
        this.handleApplySubmit = this.handleApplySubmit.bind(this);
        this.timeonChange = this.timeonChange.bind(this);
        this.downloadCSV = this.downloadCSV.bind(this);
        this.handleAccessCodeSubmit = this.handleAccessCodeSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.registerDevice = this.registerDevice.bind(this);
    }


    timeonChange(data_type, value) {

        this.changes[data_type] = value._d;
        this.setState({[data_type]: value._d})
        this.setState({changes: this.changes})
    }

    toggleAccessCode() {
        this.setState({
            add_access_modal: !this.state.add_access_modal
        })
    }

    handleSubmit(event) {

        console.log('A register device form was submitted');
        this.registerDevice()
        event.preventDefault();
    }

    registerDevice() {
        console.log(JSON.stringify({
            'user_uuid': this.state.user_uuid,
            'device_name': this.state.device_name,
            'device_reg_no': this.state.device_reg_no,
            'device_notes': this.state.device_notes,
            'device_type': this.state.device_type
        }))
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'device_name': this.state.device_name,
                'device_reg_no': this.state.device_reg_no,
                'device_notes': this.state.device_notes,
                'device_type': this.state.device_type
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.setState({
                        modal: false
                    });
                }
                this.getUserDevices()
            })
            .catch((error) => {
                console.error(error);
            });
    }

    modalToggle() {
        this.setState({
            modal: !this.state.modal
        });
    }

    addDeviceModalToggle() {
        this.setState({
            add_device_modal: !this.state.add_device_modal
        })
    }

    componentDidMount() {
        this.getUserDevices()
    }

    sliderChange(led_data_type, color_channel, value) {
        if (this.state.control_level === 'control') {
            if (led_data_type === "led_on_data") {
                let color_json = this.state.led_on_data;
                color_json[color_channel] = value;
                this.setState({led_on_data: color_json})
                this.changes['led_on_data'][color_channel] = value;
                this.setState({["led_on_border"]: "3px solid #883c63"})
                this.setState({changes: this.changes})
            }
            else if (led_data_type === "led_off_data") {
                let color_json = this.state.led_off_data;
                color_json[color_channel] = value;
                this.setState({led_off_data: color_json})
                this.changes['led_off_data'][color_channel] = value;
                this.setState({["led_off_border"]: "3px solid #883c63"})
                this.setState({changes: this.changes})
            }
        }
    }

    sensorOnChange(e) {

        if (e.target.name.indexOf("sensor") >= 0) {
            this.setState({[e.target.name + "_border"]: "3px solid #883c63"})
        }
        else {
            this.setState({[e.target.name + "_border"]: "1px solid rgba(0, 0, 0, 0.125)"})
        }
        this.changes[e.target.name] = e.target.value;
        this.setState({changes: this.changes})

        if (e.target.name === "standard_day") {
            this.setState({[e.target.name]: e.target.value})
            this.setState({standard_night: 24 - e.target.value})
        }
        this.setState({[e.target.name]: e.target.value})

    }

    handleColorChange(color, event) {
        if (this.state.control_level === 'control') {
            console.log("Event", event);
            console.log("Color", color.hex);
        }
    }

    getCurrentStats(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_current_stats/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'selected_device_uuid': device_uuid
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.setState({current_temp: responseJson["results"]["current_temp"]})
                    this.setState({current_rh: responseJson["results"]["current_rh"]})
                    this.setState({current_co2: responseJson["results"]["current_co2"]})
                    this.statecopy = this.state;
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    getUserDevices() {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_user_devices/', {
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

                    var devs = [];                  // make array
                    devs = responseJson["results"]; // assign array
                    var device_uuid = 'None'
                    if (devs.length > 0) {         // if we have devices
                        // default the selected device to the first/only dev.
                        var name = devs[0].device_name + ' (' +
                            devs[0].device_reg_no + ')';
                        device_uuid = devs[0].device_uuid;
                        this.setState({
                            selected_device: name,
                            selected_device_uuid: device_uuid
                        });
                    }

                    this.setState({user_devices: responseJson["results"]})

                    // Now go get the data that requires a device id
                    this.getTempDetails(device_uuid);
                    this.getCO2Details(device_uuid);
                    this.getCurrentStats(device_uuid);
                    this.getLEDPanel(device_uuid);

                    console.log("Response", responseJson["results"])
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    handleAccessCodeSubmit() {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/submit_access_code/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'access_code': this.state.access_code
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    console.log("Response", responseJson)
                    let devices = responseJson["devices"]
                    let all_Devices = this.state.user_devices.concat(devices)
                    this.setState({user_devices: all_Devices})
                    this.setState({add_access_modal: false})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    getCO2Details(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_co2_details/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'selected_device_uuid': device_uuid
            })
        })

            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {

                    let parseTime = d3.timeParse("%a %b %d %I:%M:%S %Y");
                    var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");
                    let co2Data = responseJson["results"]

                    co2Data.forEach(function (d) {
                        d.time = formatTime(parseTime(d.time));
                        d.value = parseFloat(d.value);
                    });

                    let co2_data_x = []
                    let co2_data_y = []
                    co2Data.forEach(function (d) {
                        co2_data_x.push(d.time);
                        co2_data_y.push(d.value);
                    });
                    this.setState({'co2_data_x': co2_data_x})
                    this.setState({'co2_data_y': co2_data_y})
                    this.setState({
                        'co2_data': [{
                            type: "scatter",
                            mode: "lines+markers",
                            name: '',
                            x: co2_data_x,
                            y: co2_data_y,
                            line: {color: '#ECAD48'}
                        }]
                    });

                    this.setState({
                        'co2_layout': {
                            width: 650,
                            height: 520,
                            xaxis: {
                                autorange: true,
                                tickformat: '%Y-%m-%d %H:%M:%S',
                                rangeslider: {
                                    type: 'date'
                                }
                            },
                            yaxis: {
                                autorange: true,
                                type: 'linear'
                            }
                        }
                    });

                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    getTempDetails(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_temp_details/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'selected_device_uuid': device_uuid
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {

                    let parseTime = d3.timeParse("%a %b %d %I:%M:%S %Y");
                    var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");
                    let tempData = responseJson["results"]["temp"]
                    let RHData = responseJson["results"]["RH"]

                    tempData.forEach(function (d) {
                        d.time = formatTime(parseTime(d.time));
                        d.value = parseFloat(d.value);
                    });
                    RHData.forEach(function (d) {
                        d.time = formatTime(parseTime(d.time));
                        d.value = parseFloat(d.value)
                    });
                    let rh_data_x = []
                    let rh_data_y = []
                    RHData.forEach(function (d) {
                        rh_data_x.push(d.time);
                        rh_data_y.push(d.value);
                    });
                    this.setState({'rh_data_x': rh_data_x})
                    this.setState({'rh_data_y': rh_data_y})
                    this.setState({
                        'rh_data': [{
                            type: "scatter",
                            mode: "lines",
                            name: '',
                            x: rh_data_x,
                            y: rh_data_y,
                            line: {color: '#95266A'}
                        }]
                    });

                    this.setState({
                        'rh_layout': {
                            width: 650,
                            height: 520,
                            xaxis: {
                                autorange: true,
                                tickformat: '%Y-%m-%d %H:%M:%S',
                                rangeslider: {
                                    type: 'date'
                                }
                            },
                            yaxis: {
                                autorange: true,
                                type: 'linear'
                            }
                        }
                    });

                    let temp_data_x = []
                    let temp_data_y = []
                    tempData.forEach(function (d) {
                        temp_data_x.push(d.time);
                        temp_data_y.push(d.value);
                    });
                    this.setState({'temp_data_x': temp_data_x})
                    this.setState({'temp_data_y': temp_data_y})
                    this.setState({
                        'temp_data': [{
                            type: "scatter",
                            mode: "lines+markers",
                            name: '',
                            x: temp_data_x,
                            y: temp_data_y,
                            line: {color: '#008BC2'}
                        }]
                    });
                    this.setState({
                        'temp_layout': {
                            width: 650,
                            height: 520,
                            xaxis: {
                                autorange: true,
                                tickformat: '%Y-%m-%d %H:%M:%S',
                                rangeslider: {
                                    type: 'date'
                                }
                            },
                            yaxis: {
                                autorange: true,
                                type: 'linear'
                            }
                        }
                    });

                    this.setState({'show_temp_line': true})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    handleChange(event) {

        this.setState({[event.target.name]: event.target.value});
        event.preventDefault();

    }

    getLEDPanel(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_led_panel/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'selected_device_uuid': device_uuid
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log("LED DATA", responseJson["results"])
                if (responseJson["response_code"] == 200) {

                    let parseTime = d3.timeParse("%a %b %d %I:%M:%S %Y");
                    var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");
                    let ledData = responseJson["results"]
                    ledData.forEach(function (d) {
                        d.time = formatTime(parseTime(d.time));
                        d.value = [d.cool_white, d.warm_white, d.blue, d.red, d.green, d.far_red];
                    });

                    let led_data_x = []
                    let led_data_cool_white = []
                    let led_data_warm_white = []
                    let led_data_blue = []
                    let led_data_red = []
                    let led_data_green = []
                    let led_data_far_red = []

                    ledData.forEach(function (d) {
                        led_data_x.push(d.time);
                        led_data_cool_white.push(d.cool_white);
                        led_data_warm_white.push(d.warm_white);
                        led_data_blue.push(d.blue);
                        led_data_red.push(d.red);
                        led_data_green.push(d.green);
                        led_data_far_red.push(d.far_red);
                    });

                    this.setState({
                        'led_data': [{
                            type: "scatter",
                            mode: "lines+markers",
                            name: 'Cool White',
                            x: led_data_x,
                            y: led_data_cool_white,
                            line: {color: '#f5f5f5'}
                        }, {
                            type: "scatter",
                            mode: "lines+markers",
                            name: 'Warm White',
                            x: led_data_x,
                            y: led_data_warm_white,
                            line: {color: '#efebd8'}
                        }, {
                            type: "scatter",
                            mode: "lines+markers",
                            name: 'Blue',
                            x: led_data_x,
                            y: led_data_blue,
                            line: {color: '#0000ff'}
                        }, {
                            type: "scatter",
                            mode: "lines+markers",
                            name: 'Red',
                            x: led_data_x,
                            y: led_data_red,
                            line: {color: '#ff0000'}
                        }, {
                            type: "scatter",
                            mode: "lines+markers",
                            name: 'Green',
                            x: led_data_x,
                            y: led_data_green,
                            line: {color: '#00ff00'}
                        }, {
                            type: "scatter",
                            mode: "lines+markers",
                            name: 'Far Red',
                            x: led_data_x,
                            y: led_data_far_red,
                            line: {color: '#960000'}
                        }]
                    });

                    this.setState({
                        'led_layout': {
                            width: 670,
                            height: 520,
                            xaxis: {
                                autorange: true,
                                tickformat: '%Y-%m-%d %H:%M:%S',
                                rangeslider: {
                                    type: 'date'
                                }
                            },
                            yaxis: {
                                autorange: true,
                                type: 'linear'
                            }
                        }
                    });

                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    toggleTempData() {
        this.setState({'show_temp_line': !this.state.show_temp_line})
    }

    toggleRHData() {
        this.setState({'show_rh_line': !this.state.show_rh_line})
    }

    onSelectDevice(e) {
        this.setState({selected_device: e.target.textContent});

        const device_uuid = e.target.value;
        const devicePermissions = this.state.user_devices.filter(device =>
            device.device_uuid === device_uuid
        );

        this.setState({
            control_level: devicePermissions[0]['permission'],
            selected_device_uuid: device_uuid,
            current_rh: 'Loading',
            current_temp: 'Loading',
            current_co2: 'Loading'
        });
        this.getTempDetails(device_uuid);
        this.getCO2Details(device_uuid);
        this.getCurrentStats(device_uuid);
        this.getLEDPanel(device_uuid);
    }

    onAddDevice() {
        this.setState({add_device_modal: true});
    }

    onAddAccessCode() {
        this.setState({add_access_modal: true})
    }

    echo(text) {

        this.child.console.log(text);
        this.setState({
            count: this.state.count + 1,
        }, this.child.console.return);
    }

    promptLabel = () => {
        return this.state.count + "> ";
    }

    downloadCSV() {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/download_as_csv/', {
            method: 'POST',
            headers: {
                'Accept': 'text/csv',
                'Content-Type': 'text/csv',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token')
            })
        }).then(function (response) {
            return response.blob();
        }).then(function (blob) {
            FileSaver.saveAs(blob, 'data.csv');
        })
    }

    applyChanges() {


        this.setState({
            modal: !this.state.modal
        });
        console.log("Current State", this.state)
    }

    handleApplySubmit() {
        console.log(this.state)
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/submit_recipe_change/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'recipe_state': JSON.stringify(this.state)
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                this.modalToggle()
                window.location.reload()
            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {
        const margin = {top: 20, right: 20, bottom: 30, left: 50};
        let changesList = []
        let changeJson = this.state.changes;
        if (this.state.changes) {
            changesList = Object.keys(changeJson).map(function (keyName, keyIndex) {

                if (keyName !== "led_on_data" && keyName !== "led_off_data") {
                    return <div className="row"><p key={keyName}>{displayNamesLookup[keyName]}
                        : {changeJson[keyName].toString()}</p><br/></div>
                }
                else if ((keyName === "led_on_data" || keyName === "led_off_data") && changeJson[keyName]) {


                    let list_led = [<p key={keyName}>Color channel information for {displayNamesLookup[keyName]}</p>]
                    let json_data = changeJson[keyName]
                    let colorsJson = []
                    colorsJson = Object.keys(json_data).map(function (keyName, keyIndex) {
                        return <p key={keyName}>{displayNamesLookup[keyName]} : {json_data[keyName]}</p>
                    })
                    list_led.push(colorsJson);
                    return list_led
                }

            })
        }

        return (

            <div className="home-container">
                <div className="row dropdown-row">
                    <div className="col-md-8">
                        <DevicesDropdown
                            devices={this.state.user_devices}
                            selectedDevice={this.state.selected_device}
                            onSelectDevice={this.onSelectDevice}
                            onAddDevice={this.onAddDevice}
                            onAddAccessCode={this.onAddAccessCode}
                        />
                    </div>
                    <div className="col-md-2">
                        <button className="apply-button btn btn-secondary" onClick={this.downloadCSV}>Download as CSV
                        </button>
                    </div>
                    <div className="col-md-2">
                        <button className="apply-button btn btn-secondary" onClick={this.applyChanges}>Apply Changes
                        </button>
                    </div>
                </div>
                <div className="row graphs-row">
                    <Draggable cancel="strong">
                        <div className="col-md-4">
                            <div className="card current-stats-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Temperature </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="knob_data">{this.state.current_temp}
                                            </div>
                                            <span className="txt_smaller"><sup>o</sup>C (Celsius) </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-4">
                            <div className="card current-stats-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Relative Humidity </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="knob_data">{this.state.current_rh}
                                            </div>
                                            <span className="txt_smaller"><sup>o</sup>% (Percent) </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-4">
                            <div className="card current-stats-card">
                                <div className="card-block">
                                    <h4 className="card-title "> CO2 Sensor </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="knob_data">{this.state.current_co2}
                                            </div>
                                            <span className="txt_smaller"><sup>o</sup>ppm (Parts per million) </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </div>

                <div className="row graphs-row">
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card led-stats-card" style={{border: this.state.led_on_border}}>
                                <div className="card-block">
                                    <h4 className="card-title "> LED Panel - ON </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="">
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Cool White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_on_data.cool_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_on_data', 'cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Warm White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_on_data.warm_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_on_data', 'warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Blue</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_on_data.blue}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_on_data', 'blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Green</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_on_data.green}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_on_data', 'green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_on_data.red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_on_data', 'red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Far Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_on_data.far_red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_on_data', 'far_red')}/>
                                                    </div>
                                                </div>

                                            </div>


                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card led-stats-card" style={{border: this.state.led_off_border}}>
                                <div className="card-block">
                                    <h4 className="card-title "> LED Panel - OFF </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="">
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Cool White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_off_data.cool_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_off_data', 'cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Warm White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_off_data.warm_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_off_data', 'warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Blue</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_off_data.blue}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_off_data', 'blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Green</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_off_data.green}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_off_data', 'green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_off_data.red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_off_data', 'red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Far Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.led_off_data.far_red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'led_off_data', 'far_red')}/>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </div>
                <div className="row graphs-row">
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card environment-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Standard Day</h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <strong className="no-cursor">

                                                <span className="txt_smaller"></span>
                                                <div className="knob_data">
                                                    <input type="text" className="recipe-details-text"
                                                           placeholder="" id="standard_day"
                                                           name="standard_day" onChange={this.sensorOnChange}/>
                                                </div>
                                                <span className="txt_smaller">hours</span>

                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card environment-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Standard Night </h4>
                                    <div className="card-text">
                                        <div className="graph">

                                            <strong className="no-cursor">

                                                <span className="txt_smaller"></span>
                                                <div className="knob_data">
                                                    <input type="number" className="recipe-details-text"
                                                           placeholder=""
                                                           id="standard_night" name="standard_night"
                                                           value={this.state.standard_night}/>
                                                </div>
                                                <span className="txt_smaller">hours</span>

                                            </strong>
                                        </div>

                                    
                                    </div>
                                </div>
                            </div>
                        </div>


                    </Draggable>
                </div>
                <div className="row graphs-row">
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card value-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Temperature Sensor </h4>
                                    <div className="row plot-row" style={{display: 'block'}}>
                                        <strong className="no-cursor"> <Plot data={this.state.temp_data}
                                                                             layout={this.state.temp_layout}
                                                                             onInitialized={(figure) => this.setState(figure)}
                                                                             onUpdate={(figure) => this.setState(figure)}/>
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-6">

                            <div className="card value-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Relative Humidity Sensor </h4>

                                    <div className="row plot-row" style={{display: 'block'}}>
                                        <strong className="no-cursor"> <Plot data={this.state.rh_data}
                                                                             layout={this.state.rh_layout}
                                                                             onInitialized={(figure) => this.setState(figure)}
                                                                             onUpdate={(figure) => this.setState(figure)}/>
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </div>
                <div className="row graphs-row">
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card value-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Carbon Dioxide Sensor </h4>

                                    <div className="row plot-row" style={{display: 'block'}}>
                                        <strong className="no-cursor"> <Plot data={this.state.co2_data}
                                                                             layout={this.state.co2_layout}
                                                                             onInitialized={(figure) => this.setState(figure)}
                                                                             onUpdate={(figure) => this.setState(figure)}
                                                                             config={this.state.config}/>
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card value-card">
                                <div className="card-block">
                                    <h4 className="card-title "> LED Panel History </h4>
                                    {/*Insert Style here to prevent style overrride*/}
                                    <div className="row plot-row" style={{display: 'block'}}>
                                        <strong className="no-cursor"> <Plot data={this.state.led_data}
                                                                             layout={this.state.led_layout}
                                                                             onInitialized={(figure) => this.setState(figure)}
                                                                             onUpdate={(figure) => this.setState(figure)}
                                                                             config={this.state.config}/>
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </div>
                <Modal isOpen={this.state.modal} toggle={this.modalToggle} className={this.props.className}>
                    <ModalHeader toggle={this.modalToggle}>Apply Recipe Changes</ModalHeader>

                    <ModalBody>
                        Are you sure you want to apply these changes to your device ?
                        <div>
                            {changesList}
                        </div>

                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.handleApplySubmit}>Apply</Button>{' '}
                        <Button color="secondary" onClick={this.modalToggle}>Close</Button>
                    </ModalFooter>
                </Modal>
                <Modal isOpen={this.state.add_device_modal} toggle={this.addDeviceModalToggle}
                       className={this.props.className}>
                    <ModalHeader toggle={this.toggle}>New Device Registration</ModalHeader>
                    <ModalBody>
                        <Form>
                            <FormGroup>
                                <Label for="device_name">Device name :</Label>
                                <Input type="text" name="device_name" id="device_name"
                                       placeholder="E.g Caleb's FC" value={this.state.device_name}
                                       onChange={this.handleChange}/>
                            </FormGroup>
                            <FormGroup>
                                <Label for="device_reg_no">Device Number :</Label>
                                <Input type="text" name="device_reg_no" id="device_reg_no"
                                       placeholder="Six digit code" value={this.state.device_reg_no}
                                       onChange={this.handleChange}/>
                            </FormGroup>
                            <FormGroup>
                                <Label for="device_notes">Device Notes :</Label>
                                <Input type="text" name="device_notes" id="device_notes"
                                       placeholder="(Optional)" value={this.state.device_notes}
                                       onChange={this.handleChange}/>
                            </FormGroup>
                            <FormGroup>
                                <Label for="device_type">Device Type :</Label>
                                <select className="form-control smallInput" name="device_type" id="device_type"
                                        onChange={this.handleChange}
                                        value={this.state.device_type}>
                                    <option value="PFC_EDU">Personal Food Computer+EDU</option>
                                    <option value="Food_Server">Food Server</option>
                                </select>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.handleSubmit}>Register Device</Button>{' '}
                        <Button color="secondary" onClick={this.addDeviceModalToggle}>Cancel</Button>
                    </ModalFooter>
                </Modal>


                <Modal isOpen={this.state.add_access_modal} toggle={this.toggleAccessCode}
                       className={this.props.className}>
                    <ModalHeader toggle={this.toggle}>Enter a access code</ModalHeader>
                    <ModalBody>
                        <Form>
                            <FormGroup>
                                <Label for="access_code"></Label>
                                <Input type="text" name="access_code" id="access_code"
                                       placeholder="6-digit Access Code" value={this.state.access_code}
                                       onChange={this.handleChange}/>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.handleAccessCodeSubmit}>Submit</Button>{' '}
                        <Button color="secondary" onClick={this.toggleAccessCode}>Cancel</Button>
                    </ModalFooter>
                </Modal>
            </div>
        )

    }
}

export default withCookies(DeviceHomepage);
