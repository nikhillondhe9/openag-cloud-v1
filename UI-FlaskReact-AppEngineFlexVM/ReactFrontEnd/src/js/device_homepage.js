import React, {Component} from 'react';

import '../css/device_homepage.css';
import {Cookies, withCookies} from "react-cookie";
// import Plot from 'react-plotly.js';
import * as d3 from "d3";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import {Dropdown, DropdownToggle, DropdownMenu, DropdownItem} from 'reactstrap';
import {$, jQuery} from 'jquery';
// export for others scripts to use
import Draggable from 'react-draggable'; // The default
import {DraggableCore} from 'react-draggable'; // <DraggableCore>
// import React from 'react';
import Plot from 'react-plotly.js';


class DeviceHomepage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rh_data: [],
            temp_data_x: [],
            temp_data_y: [],
            led_data: [],
            temp_data: [],
            temp_layout: {title:'Temperature',width:200,height:200},
            show_temp_line: false,
            show_rh_line: false,
            user_devices: [],
            dropdownOpen: false,
            dropDownValue: 'Choose a PFC',
            recipe_name: '',
            recipe_link: ''
        }
        this.getTempDetails = this.getTempDetails.bind(this);
        this.toggleRHData = this.toggleRHData.bind(this);
        this.toggleTempData = this.toggleTempData.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);
        this.getUserDevices = this.getUserDevices.bind(this);
        this.toggle = this.toggle.bind(this);
        this.changeValue = this.changeValue.bind(this);
        // this.getLEDPanel = this.getLEDPanel.bind(this)

    }

    toggle() {
        this.setState(prevState => ({
            dropdownOpen: !prevState.dropdownOpen
        }));
    }

    componentDidMount() {
        this.getUserDevices()
        this.getTempDetails();
        // this.getLEDPanel();
    }

    handleColorChange(color, event) {
        console.log("Event", event);
        console.log("Color", color.hex);
    }


    getUserDevices() {
        return fetch('http://food.computer.com:5000/api/get_user_devices/', {
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
                    this.setState({user_devices: responseJson["results"]})
                    this.setState({dropDownValue: 'SecondAtTest(343322)'})
                    console.log("Response", responseJson["results"])
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    getTempDetails() {
        return fetch('http://food.computer.com:5000/api/get_temp_details/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
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
                    let temp_data_x = []
                    let temp_data_y = []
                    tempData.forEach(function (d) {
                        temp_data_x.push(d.time);
                        temp_data_y.push(d.value);
                    });
                    this.setState({'temp_data_x': temp_data_x})
                    this.setState({'temp_data_x': temp_data_y})
                    this.setState({
                        'temp_data': [{
                            type: "scatter",
                            mode: "lines",
                            name: 'AAPL High',
                            x: temp_data_x,
                            y: temp_data_y,
                            line: {color: '#17BECF'}
                        }]
                    });
                    this.setState({
                        'temp_layout': {
                            title: 'Time Series with Rangeslider',
                            width: 700,
                            height: 500,
                            xaxis: {
                                autorange: true,
                                range: ['2018-04-17 00:00:00', '2018-04-18 14:11:45'],
                                rangeselector: {
                                    buttons: [
                                        {
                                            count: 1,
                                            label: '1m',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {
                                            count: 6,
                                            label: '6m',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {step: 'all'}
                                    ]
                                },
                                rangeslider: {range: ['2018-01-17 14:11:45', '2018-10-17 14:11:45']},
                                type: 'date',
                                tickformat: '%Y-%m-%d %H:%M:%S'
                            },
                            yaxis: {
                                autorange: true,
                                type: 'linear'
                            }
                        }
                    })


                    console.log("x", temp_data_x)
                    this.setState({'show_temp_line': true})
                    this.setState({'rh_data': RHData})
                    // this.setState({'rh_data': responseJson["results"]['RH']})
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    getLEDPanel() {
        return fetch('http://food.computer.com:5000/api/get_led_panel/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    console.log("led panel", responseJson["results"])
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

    changeValue(e) {
        console.log("Selected devic SecondAtTest(343322) e", e.currentTarget.textContent)
        this.setState({dropDownValue: e.currentTarget.textContent})
    }

    render() {
        const margin = {top: 20, right: 20, bottom: 30, left: 50};
        let listDevices = <p>Loading</p>
        if (this.state.user_devices.length > 0) {
            listDevices = this.state.user_devices.map((device) => {
                return <DropdownItem key={device.device_uuid}
                                     onClick={this.changeValue}>{device.device_name}
                    ({device.device_reg_no}) </DropdownItem>
            });

        }


        return (
            <div className="home-container">
                <div className="row dropdown-row">

                    <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}
                              className="row dropdow-row">
                        <DropdownToggle caret>
                            {this.state.dropDownValue}
                        </DropdownToggle>
                        <DropdownMenu>
                            {listDevices}
                        </DropdownMenu>
                    </Dropdown>

                </div>
                <Draggable axis="y">


                    <div className="row">
                        <div className="col-md-2">
                            <div className="card value-card" onClick={this.toggleTempData}>
                                <div className="card-block">
                                    <h4 className="card-title"> Temperature </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="knob_data">89
                                            </div>
                                            <span className="txt_smaller"><sup>o</sup>F (Farenheit) </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-10">

                            <div className="card value-card" onClick={this.toggleTempData}>
                                <div className="card-block">
                                    <h4 className="card-title"> Temperature </h4>
                                    <div className="card-text">

                                        <Plot className="graph" data={this.state.temp_data}
                                              layout={this.state.temp_layout}
                                              onInitialized={(figure) => this.setState(figure)}
                                              onUpdate={(figure) => this.setState(figure)}/>

                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </Draggable>
            </div>
        )

    }
}

export default withCookies(DeviceHomepage);
