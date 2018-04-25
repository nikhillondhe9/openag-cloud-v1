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

var colors = ['#FD9827', '#DA3B21', '#3669C9', '#1D9524', '#971497'];
export const coolwhite = {
    hsl: {a: 1, h: 330, l: 96.9, s: 100.0},
    hex: '#FFEFF7',
    rgb: {r: 255, g: 239, b: 247, a: 1},
    hsv: {h: 330, s: 6.3, v: 96.9, a: 1},
};
export const warmwhite = {
    hsv: {a: 1, h: 35, v: 100, s: 10.2},
    hsl: {a: 1, h: 35, l: 94.9, s: 100.0},
    hex: '#FFF4E5',
    rgb: {r: 255, g: 244, b: 229, a: 1}
};
export const blue = {
    hsv: {a: 1, h: 240, v: 100, s: 100},
    hsl: {a: 1, h: 240, l: 50.0, s: 100.0},
    hex: '#0000ff',
    rgb: {r: 0, g: 0, b: 255, a: 1}
};


var AxisX = createReactClass({
    render() {
        var data = this.props.data;
        var margin = this.props.margin;
        var height = this.props.height - margin.top - margin.bottom;
        var width = this.props.width - margin.left - margin.right;

        var x = d3.scaleTime()
            .rangeRound([0, width]);

        var xAxis = d3.axisBottom()
            .scale(x);
        x.domain(d3.extent(data, function (d) {
            return d.time;
        }));

        d3.select(".x").attr("transform", "translate(0," + height + ")").call(xAxis);

        return (
            <g className="x axis"></g>
        );
    }
});
var AxisY = createReactClass({
    render() {
        var data = this.props.data;
        var margin = this.props.margin;
        var height = this.props.height - margin.top - margin.bottom;
        var width = this.props.width - margin.left - margin.right;

        var y = d3.scaleLinear()
            .rangeRound([height, 0]);

        var yAxis = d3.axisLeft()
            .scale(y);

        y.domain(d3.extent(data, function (d) {
            return d.value;
        }));

        d3.select(".y").call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")

        return (
            <g className="y axis"></g>
        );
    }
});
var Line = createReactClass({
    render() {
        var data = this.props.data;
        var margin = this.props.margin;
        var height = this.props.height - margin.top - margin.bottom;
        var width = this.props.width - margin.left - margin.right;
        var strokeColor = this.props.strokeColor;
        // var scale = d3.scaleTime().domain([27.571453, 28.26054]).range([0, width]);
        // console.log("Scale",scale(27.6322))
        var x = d3.scaleTime()
            .rangeRound([0, width]).domain(d3.extent(data, function (d) {
                return d.time;
            }));

        var y = d3.scaleLinear()
            .rangeRound([height, 0]).domain(d3.extent(data, function (d) {
                return d.value;
            }));

        var line = d3.line()
            .x(function (d) {
                return x(d.time)
            })
            .y(function (d) {
                return y(d.value)
            });

        // console.log("New line",n)
        var newline = line(data);
        console.log(newline);

        return (

            <path className="line shadow" stroke={strokeColor} d={newline}></path>


        );
    }
});

class DeviceHomepage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            'rh_data': [],
            'temp_data': [],
            'led_data': [],
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
                    this.setState({dropDownValue:'SecondAtTest(343322)' })
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
                    let tempData = responseJson["results"]["temp"]
                    let RHData = responseJson["results"]["RH"]
                    tempData.forEach(function (d) {
                        d.time = parseTime(d.time);
                        d.value = parseFloat(d.value);
                    });
                    RHData.forEach(function (d) {
                        d.time = parseTime(d.time);
                        d.value = parseFloat(d.value)
                    });
                    this.setState({'temp_data': tempData})
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
        console.log("Selected devic SecondAtTest(343322) e",e.currentTarget.textContent)
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
            <div className="plot-container">
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
                <div className="row">
                    <div className="col-md-5">
                        <div className="row">
                            <div className="col-md-6">
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
                            <div className="col-md-6">
                                <div className="card value-card" onClick={this.toggleRHData}>
                                    <div className="card-block">
                                        <h4 className="card-title"> Relative Humidity </h4>
                                        <div className="card-text">
                                            <div className="graph">
                                                <div className="knob_data">34.43
                                                </div>
                                                <span className="txt_smaller">OOM
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row value-row">
                            <div className="col-md-12">
                                <div className="card value-card colors-card">
                                    <div className="card-block">
                                        <h4 className="card-title"> LED Panel </h4>
                                        <div className="card-text">
                                            <div className="colors-graph"><span className="txt_smaller">State ON - LED Spectrum
                                                </span></div>
                                            <div className="row colors-row">
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
                                            <div className="colors-graph"><span className="txt_smaller">State OFF - LED Spectrum
                                                </span></div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Cool White</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={20} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Warm White</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={10} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Blue</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={0} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Green</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={0} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Red</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={0} handle={handle}/>
                                                </div>
                                            </div>
                                            <div className="row colors-row">
                                                <div className="col-md-6">
                                                    <span>Far Red</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <Slider min={0} max={255} defaultValue={244} handle={handle}/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-7">
                        <svg height={450} width={600}>
                            <g transform="translate(50,20)">
                                {this.state.show_rh_line &&
                                <AxisX width={600} height={450} margin={margin} data={this.state.rh_data}/>}
                                {this.state.show_rh_line &&
                                <AxisY width={600} height={450} margin={margin} data={this.state.rh_data}/>}
                                {this.state.show_rh_line &&
                                <Line width={600} height={450} margin={margin} data={this.state.rh_data}
                                      strokeColor={colors[1]}/>}

                                {this.state.show_temp_line &&
                                <AxisX width={600} height={450} margin={margin} data={this.state.temp_data}/>}
                                {this.state.show_temp_line &&
                                <AxisY width={600} height={450} margin={margin} data={this.state.temp_data}/>}
                                {this.state.show_temp_line &&
                                <Line width={600} height={450} margin={margin} data={this.state.temp_data}
                                      strokeColor={colors[2]}/>}
                                {/*<Dots data={data} x={x} y={y}/>*/}
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
        )

    }
}

export default withCookies(DeviceHomepage);

