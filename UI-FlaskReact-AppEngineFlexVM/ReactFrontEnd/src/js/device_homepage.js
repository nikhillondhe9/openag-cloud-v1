import React, {Component} from 'react';
import '../css/device_homepage.css';
import {Cookies, withCookies} from "react-cookie";
import * as d3 from "d3";
import {$, jQuery} from 'jquery';
import Draggable from 'react-draggable';
import Plot from 'react-plotly.js';
import 'rc-time-picker/assets/index.css';
import Console from 'react-console-component';
import 'react-console-component/main.css';
import {Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';
import FileSaver from 'file-saver';

import {DevicesDropdown} from './components/devices_dropdown';
import {AddAccessCodeModal} from './components/add_access_code_modal';
import {AddDeviceModal} from './components/add_device_modal';


const showSecond = true;
const str = showSecond ? 'HH:mm:ss' : 'HH:mm';
const displayNamesLookup = {
    "cool_white": "400-449 (in nm)",
    "warm_white": "449-499 (in nm)",
    "blue": "Blue",
    "far_red": "650-699 (in nm)",
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
            user_devices: new Map(),
            selected_device: 'Loading',
            recipe_name: '',
            recipe_link: '',
            modal: false,
            add_device_modal: false,
            add_access_modal: false,
            access_code_error_message: '',
            add_device_error_message: '',
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
        this.modalToggle = this.modalToggle.bind(this);
        this.onSelectDevice = this.onSelectDevice.bind(this);
        this.sensorOnChange = this.sensorOnChange.bind(this);
        this.echo = this.echo.bind(this);
        this.InputChange = this.InputChange.bind(this);
        this.applyChanges = this.applyChanges.bind(this);
        this.handleApplySubmit = this.handleApplySubmit.bind(this);
        this.timeonChange = this.timeonChange.bind(this);
        this.downloadCSV = this.downloadCSV.bind(this);
    }


    timeonChange(data_type, value) {

        this.changes[data_type] = value._d;
        this.setState({[data_type]: value._d})
        this.setState({changes: this.changes})
    }

    toggleDeviceModal = () => {
        this.setState(prevState => {
            return {
                add_device_modal: !prevState.add_device_modal,
                add_device_error_message: ''
            }
        });
    }

    toggleAccessCodeModal = () => {
        this.setState(prevState => {
            return {
                add_access_modal: !prevState.add_access_modal,
                access_code_error_message: ''
            }
        });
    }

    onSubmitDevice = (modal_state) => {
        console.log(JSON.stringify({
            'user_token': this.props.cookies.get('user_token'),
            'device_name': modal_state.device_name,
            'device_reg_no': modal_state.device_reg_no,
            'device_notes': modal_state.device_notes,
            'device_type': modal_state.device_type
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
                'device_name': modal_state.device_name,
                'device_reg_no': modal_state.device_reg_no,
                'device_notes': modal_state.device_notes,
                'device_type': modal_state.device_type
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.toggleDeviceModal();
                    this.getUserDevices()
                } else {
                    this.setState({
                        add_device_error_message: responseJson["message"]
                    });
                }
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

    componentDidMount() {
        this.getUserDevices()
    }

    InputChange(led_data_type, color_channel, value) {
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

                    let devices = new Map();
                    for (const device of responseJson["results"]) {
                        devices.set(device.device_uuid, device);
                    }
                    this.setState({user_devices: devices});

                    // Now go get the data that requires a device id
                    this.getTempDetails(device_uuid);
                    this.getCO2Details(device_uuid);
                    this.getCurrentStats(device_uuid);
                    this.getLEDPanel(device_uuid);
                } else {
                    this.setState({selected_device: 'No Devices'});
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    onSubmitAccessCode = (modal_state) => {
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
                'access_code': modal_state.access_code
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson["response_code"] == 200) {
                    this.toggleAccessCodeModal();
                    this.getUserDevices();
                } else {
                    this.setState({
                        access_code_error_message: responseJson['message']
                    });
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
                                rangeInput: {
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
                                rangeInput: {
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
                                rangeInput: {
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
                            name: '400-449 (in nm)',
                            x: led_data_x,
                            y: led_data_cool_white,
                            line: {color: '#f5f5f5'}
                        }, {
                            type: "scatter",
                            mode: "lines+markers",
                            name: '449-499 (in nm)',
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
                            name: '650-699 (in nm)',
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
                                rangeInput: {
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
        console.log(this.state.user_devices);
        const devicePermissions = this.state.user_devices.get(device_uuid);
        console.log(devicePermissions);

        this.setState({
            control_level: devicePermissions['permission'],
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
                            devices={[...this.state.user_devices.values()]}
                            selectedDevice={this.state.selected_device}
                            onSelectDevice={this.onSelectDevice}
                            onAddDevice={this.toggleDeviceModal}
                            onAddAccessCode={this.toggleAccessCodeModal}
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
                                                        <span>400-449 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_on_data.cool_white}

                                                                onChange={this.InputChange.bind(this, 'led_on_data', 'cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>449-499 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_on_data.warm_white}

                                                                onChange={this.InputChange.bind(this, 'led_on_data', 'warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>500-549 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_on_data.blue}

                                                                onChange={this.InputChange.bind(this, 'led_on_data', 'blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                       <span>550-599 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_on_data.green}

                                                                onChange={this.InputChange.bind(this, 'led_on_data', 'green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>600-649 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_on_data.red}

                                                                onChange={this.InputChange.bind(this, 'led_on_data', 'red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>650-699 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_on_data.far_red}

                                                                onChange={this.InputChange.bind(this, 'led_on_data', 'far_red')}/>
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
                                                        <span>400-449 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_off_data.cool_white}

                                                                onChange={this.InputChange.bind(this, 'led_off_data', 'cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>449-499 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_off_data.warm_white}

                                                                onChange={this.InputChange.bind(this, 'led_off_data', 'warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>500-549 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_off_data.blue}

                                                                onChange={this.InputChange.bind(this, 'led_off_data', 'blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                       <span>550-599 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_off_data.green}

                                                                onChange={this.InputChange.bind(this, 'led_off_data', 'green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>600-649 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_off_data.red}

                                                                onChange={this.InputChange.bind(this, 'led_off_data', 'red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>650-699 (in nm)</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Input
                                                                defaultValue={this.state.led_off_data.far_red}

                                                                onChange={this.InputChange.bind(this, 'led_off_data', 'far_red')}/>
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
                <AddDeviceModal
                    isOpen={this.state.add_device_modal}
                    toggle={this.toggleDeviceModal}
                    onSubmit={this.onSubmitDevice}
                    error_message={this.state.add_device_error_message}
                />
                <AddAccessCodeModal
                    isOpen={this.state.add_access_modal}
                    toggle={this.toggleAccessCodeModal}
                    onSubmit={this.onSubmitAccessCode}
                    error_message={this.state.access_code_error_message}
                />
            </div>
        )

    }
}

export default withCookies(DeviceHomepage);
