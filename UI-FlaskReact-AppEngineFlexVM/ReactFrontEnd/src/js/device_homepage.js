import React, {Component} from 'react';
import '../css/device_homepage.css';
import {Cookies, withCookies} from "react-cookie";
import * as d3 from "d3";
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from 'reactstrap';
import {$, jQuery} from 'jquery';
import Draggable from 'react-draggable';
import Plot from 'react-plotly.js';
import moment from 'moment';

import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import Console from 'react-console-component';
import 'react-console-component/main.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

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


class DeviceHomepage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count:0,
            sensor_temp_border:"",
            sensor_co2_border:"",
            sensor_rh_border:"",
            led_on_border:"",
            led_off_border:"",
            config: {'displaylogo': false},
            current_rh: "Loading",
            current_temp: "Loading",
            current_co2: "Loading",
            sensor_co2: 1231,
            sensor_temp: 120,
            sensor_rh: 200,
            rh_data: [],
            co2_data: [],
            led_on_data:{cool_white:10,red:100,blue:29,green:39,warm_white:3,far_red:22},
            led_off_data:{cool_white:10,red:100,blue:29,green:39,warm_white:3,far_red:22},
            temp_data_x: [],
            temp_data_y: [],
            co2_data_x: [],
            co2_data_y: [],
            rh_data_x: [],
            rh_data_y: [],
            led_data: [],
            temp_data: [],
            temp_layout: {title: '', width: 1, height: 1},
            rh_layout: {title: '', width: 1, height: 1},
            co2_layout: {title: '', width: 1, height: 1},
            show_temp_line: false,
            show_rh_line: false,
            user_devices: [],
            dropdownOpen: false,
            dropDownValue: 'Choose a PFC',
            recipe_name: '',
            recipe_link: '',
            modal: false
        };
        this.child = {
		console : Console
        };
        this.changes = {led_on_data:{},led_off_data:{}}
        this.getCurrentStats = this.getCurrentStats.bind(this);
        this.getTempDetails = this.getTempDetails.bind(this);
        this.getCO2Details = this.getCO2Details.bind(this);
        this.toggleRHData = this.toggleRHData.bind(this);
        this.toggleTempData = this.toggleTempData.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);
        this.getUserDevices = this.getUserDevices.bind(this);
        this.toggle = this.toggle.bind(this);
        this.modalToggle = this.modalToggle.bind(this);
        this.changeValue = this.changeValue.bind(this);
        this.sensorOnChange = this.sensorOnChange.bind(this);
        this.echo = this.echo.bind(this);
        this.sliderChange = this.sliderChange.bind(this);
        this.applyChanges = this.applyChanges.bind(this);
        // this.getLEDPanel = this.getLEDPanel.bind(this)

    }

    timeonChange(value) {

    }
    modalToggle() {
        this.setState({
            modal: !this.state.modal
        });
    }
    toggle() {
        this.setState(prevState => ({
            dropdownOpen: !prevState.dropdownOpen
        }));
    }

    componentDidMount() {
        this.getUserDevices()
        this.getTempDetails();
        this.getCO2Details();
        this.getCurrentStats();
        // this.getLEDPanel();
    }
    sliderChange(led_data_type,color_channel,value)
    {
        if (led_data_type === "led_on_data") {
            let color_json = this.state.led_on_data;
            color_json[color_channel] = value;
            this.setState({led_on_data: color_json})
            this.changes['led_on_data'][color_channel] = value;
            this.setState({["led_on_border"]:"3px solid #883c63"})
        }
        else if(led_data_type === "led_off_data")
        {
            let color_json = this.state.led_off_data;
            color_json[color_channel] = value;
            this.setState({led_off_data: color_json})
            this.changes['led_off_data'][color_channel] = value;
            this.setState({["led_off_border"]:"3px solid #883c63"})
        }
    }
    sensorOnChange(e) {
        if(e.target.name.indexOf("sensor") >= 0 )
        {
            this.setState({[e.target.name+"_border"]:"3px solid #883c63"})
        }
        else
        {
            this.setState({[e.target.name+"_border"]:"1px solid rgba(0, 0, 0, 0.125)"})
        }
        this.changes[e.target.name] = e.target.value;
        this.setState({[e.target.name]: e.target.value})

    }

    handleColorChange(color, event) {
        console.log("Event", event);
        console.log("Color", color.hex);
    }

    getCurrentStats() {


        return fetch('http://food.computer.com:5000/api/get_current_stats/', {
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

    getCO2Details() {
        return fetch('http://food.computer.com:5000/api/get_co2_details/', {
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
                            name: 'AAPL High',
                            x: co2_data_x,
                            y: co2_data_y,
                            line: {color: '#ECAD48'}
                        }]
                    });

                    this.setState({
                        'co2_layout': {

                            width: 650,
                            height: 500,
                            xaxis: {
                                autorange: true,
                                range: ['2018-03-27 14:11:45', '2018-04-28 14:11:45'],
                                rangeselector: {
                                    buttons: [
                                        {
                                            count: 30,
                                            label: 'Last Month',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {
                                            count: 7,
                                            label: 'Last Week',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {step: 'all'}
                                    ]
                                },
                                rangeslider: {range: ['2018-03-28 14:11:45', '2018-04-28 14:11:45']},
                                type: 'date',
                                tickformat: '%Y-%m-%d %H:%M:%S'
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
                    let rh_data_x = []
                    let rh_data_y = []
                    tempData.forEach(function (d) {
                        rh_data_x.push(d.time);
                        rh_data_y.push(d.value);
                    });
                    this.setState({'rh_data_x': rh_data_x})
                    this.setState({'rh_data_y': rh_data_y})
                    this.setState({
                        'rh_data': [{
                            type: "scatter",
                            mode: "lines",
                            name: 'AAPL High',
                            x: rh_data_x,
                            y: rh_data_y,
                            line: {color: '#95266A'}
                        }]
                    });

                    this.setState({
                        'rh_layout': {

                            width: 650,
                            height: 500,
                            xaxis: {
                                autorange: true,
                                range: ['2018-03-20 14:11:45', '2018-04-20 14:11:45'],
                                rangeselector: {
                                    buttons: [
                                        {
                                            count: 30,
                                            label: 'Last Month',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {
                                            count: 7,
                                            label: 'Last Week',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {step: 'all'}
                                    ]
                                },
                                rangeslider: {range: ['2018-03-20 14:11:45', '2018-04-20 14:11:45']},
                                type: 'date',
                                tickformat: '%Y-%m-%d %H:%M:%S'
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
                            name: 'AAPL High',
                            x: temp_data_x,
                            y: temp_data_y,
                            line: {color: '#008BC2'}
                        }]
                    });
                    this.setState({
                        'temp_layout': {
                            width: 650,
                            height: 500,
                            xaxis: {
                                autorange: true,
                                range: ['2018-03-27 14:11:45', '2018-04-28 14:11:45'],
                                rangeselector: {
                                    buttons: [
                                        {
                                            count: 30,
                                            label: 'Last Month',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {
                                            count: 7,
                                            label: 'Last Week',
                                            step: 'time',
                                            stepmode: 'backward'
                                        },
                                        {step: 'all'}
                                    ]
                                },
                                rangeslider: {range: ['2018-03-28 14:11:45', '2018-04-28 14:11:45']},
                                type: 'date',
                                tickformat: '%Y-%m-%d %H:%M:%S'
                            },
                            yaxis: {
                                autorange: true,
                                type: 'linear'
                            }
                        }
                    });


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

	echo(text){

		this.child.console.log(text);
		this.setState({
			count: this.state.count+1,
		}, this.child.console.return);
	}
	promptLabel = () => {
		return this.state.count + "> ";
	}
	applyChanges()
    {
        for (var k in this.changes) {
            console.log("key",k)
        }

        this.setState({
            modal:!this.state.modal
        });
        console.log("Current State",this.state)
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
                {/*<div className="row">*/}
                     {/*<div className="col-md-8">*/}
                    <div className="row dropdown-row">
                        <div className="col-md-6">
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
                        <div className="col-md-6">
                            <button className="apply-button btn btn-secondary" onClick={this.applyChanges}>Apply Changes</button>
                        </div>
                    </div>
                     {/*</div>*/}
                    {/*<div className="col-md-4">*/}
                        {/*<Console ref={ref => this.child.console = ref}*/}
			{/*handler={this.echo}*/}
			{/*promptLabel={this.promptLabel}*/}
			{/*welcomeMessage={"Use this console to manipulate the dashboard."}*/}
			{/*autofocus={true} />*/}
                    {/*</div>*/}
                {/*</div>*/}
                <div className="row graphs-row">
                    <Draggable cancel="strong">
                        <div className="col-md-4">
                            <div className="card current-stats-card" >
                                <div className="card-block">
                                    <h4 className="card-title "> Temperature </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="knob_data">{this.state.current_temp}
                                            </div>
                                            <span className="txt_smaller"><sup>o</sup>F (Farenheit) </span>
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
                        <div className="col-md-4">
                            <div className="card current-stats-card" style={{border: this.state.sensor_temp_border}}>
                                <div className="card-block">
                                    <h4 className="card-title "> Temperature </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <strong className="no-cursor">
                                                <span className="txt_smaller">Publish sensor values every</span>
                                                <div className="knob_data"><input defaultValue={this.state.sensor_temp}
                                                                                  onChange={this.sensorOnChange}
                                                                                  id="sensor_temp" name="sensor_temp"
                                                                                  type="text"
                                                                                  ref="sensor_temp"/>
                                                </div>
                                                <span className="txt_smaller">seconds</span>
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-4">
                            <div className="card current-stats-card" style={{border: this.state.sensor_rh_border}}>
                                <div className="card-block" >
                                    <h4 className="card-title "> Relative Humidity </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <strong className="no-cursor">
                                                <span className="txt_smaller">Publish sensor values every</span>
                                                <div className="knob_data"><input defaultValue={this.state.sensor_rh}
                                                                                  onChange={this.sensorOnChange}
                                                                                  id="sensor_rh" name="sensor_rh"
                                                                                  type="text"
                                                                                  ref="sensor_rh"/>
                                                </div>
                                                <span className="txt_smaller">seconds</span>
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                    <Draggable cancel="strong">
                        <div className="col-md-4">
                            <div className="card current-stats-card" style={{border: this.state.sensor_co2_border}}>
                                <div className="card-block">
                                    <h4 className="card-title "> CO2 Sensor </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <strong className="no-cursor">
                                                <span className="txt_smaller">Publish sensor values every</span>
                                                <div className="knob_data"><input defaultValue={this.state.sensor_co2}
                                                                                  onChange={this.sensorOnChange}
                                                                                  id="sensor_co2" name="sensor_co2"
                                                                                  type="text"
                                                                                  ref="sensor_co2"/>
                                                </div>
                                                <span className="txt_smaller">seconds</span>
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
                                                        <Slider min={0} max={255} defaultValue={this.state.led_on_data.cool_white} handle={handle} onChange={this.sliderChange.bind(this,'led_on_data','cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Warm White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_on_data.warm_white} handle={handle} onChange={this.sliderChange.bind(this,'led_on_data','warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Blue</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_on_data.blue} handle={handle} onChange={this.sliderChange.bind(this,'led_on_data','blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Green</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_on_data.green} handle={handle} onChange={this.sliderChange.bind(this,'led_on_data','green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_on_data.red} handle={handle} onChange={this.sliderChange.bind(this,'led_on_data','red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Far Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_on_data.far_red} handle={handle} onChange={this.sliderChange.bind(this,'led_on_data','far_red')}/>
                                                    </div>
                                                </div>

                                            </div>

                                            <span className="txt_smaller">
                                                <div className="row time-row">
                                                    <div className="col-md-2">
                                                        From
                                                    </div>
                                                <div className="col-md-4">
                                                    <TimePicker
                                                        style={{width: 150}}
                                                        showSecond={showSecond}
                                                        defaultValue={moment()}
                                                        className="xxx"
                                                        onChange={this.timeonChange.bind("led_on_from")}
                                                    />
                                                </div>
                                                    <div className="col-md-2">
                                                        To
                                                    </div>
                                                <div className="col-md-4"> <TimePicker
                                                    style={{width: 150}}
                                                    showSecond={showSecond}
                                                    defaultValue={moment()}
                                                    className="xxx"
                                                    onChange={this.timeonChange()}
                                                />
                                                </div>
                                            </div></span>
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
                                                        <Slider min={0} max={255} defaultValue={this.state.led_off_data.cool_white} handle={handle} onChange={this.sliderChange.bind(this,'led_off_data','cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Warm White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_off_data.warm_white} handle={handle} onChange={this.sliderChange.bind(this,'led_off_data','warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Blue</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_off_data.blue} handle={handle} onChange={this.sliderChange.bind(this,'led_off_data','blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Green</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_off_data.green} handle={handle} onChange={this.sliderChange.bind(this,'led_off_data','green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_off_data.red} handle={handle} onChange={this.sliderChange.bind(this,'led_off_data','red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Far Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255} defaultValue={this.state.led_off_data.far_red} handle={handle} onChange={this.sliderChange.bind(this,'led_off_data','far_red')}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="txt_smaller">
                                                <div className="row time-row">
                                                    <div className="col-md-2">
                                                        From
                                                    </div>
                                                <div className="col-md-4">
                                                    <TimePicker
                                                        style={{width: 150}}
                                                        showSecond={showSecond}
                                                        defaultValue={moment()}
                                                        className="xxx"
                                                        onChange={this.timeonChange()}
                                                    />
                                                </div>
                                                    <div className="col-md-2">
                                                        To
                                                    </div>
                                                <div className="col-md-4"> <TimePicker
                                                    style={{width: 150}}
                                                    showSecond={showSecond}
                                                    defaultValue={moment()}
                                                    className="xxx"
                                                    onChange={this.timeonChange()}
                                                /> </div>
                                            </div>
                                                </span>
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
                                    <div className="row">
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

                                    <div className="row">
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
                </div>
                <div className="row graphs-row">
                    <Draggable cancel="strong">
                        <div className="col-md-6">
                            <div className="card value-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Carbon Dioxide Sensor </h4>

                                    <div className="row">
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
                </div>
                 <Modal isOpen={this.state.modal} toggle={this.modalToggle} className={this.props.className}>
                        <ModalHeader toggle={this.toggle}>Apply Recipe Changes</ModalHeader>

                        <ModalBody>
                            Are you sure you want to apply these changes to your device ?

                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.handleApplySubmit}>Apply</Button>{' '}
                            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                        </ModalFooter>
                    </Modal>
            </div>
        )

    }
}

export default withCookies(DeviceHomepage);
