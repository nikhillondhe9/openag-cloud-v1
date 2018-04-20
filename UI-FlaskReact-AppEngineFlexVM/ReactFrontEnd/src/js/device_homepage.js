import React, {Component} from 'react';

import '../css/device_homepage.css';
import {Cookies, withCookies} from "react-cookie";
// import Plot from 'react-plotly.js';
import * as d3 from "d3";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";


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

                <path className="line shadow" d={newline}></path>

            
        );
    }
});

class DeviceHomepage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            'rh_data': [],
            'temp_data': [],
            'led_data': []
        }
        this.getTempDetails = this.getTempDetails.bind(this)
        // this.getLEDPanel = this.getLEDPanel.bind(this)

    }

    componentDidMount() {
        this.getTempDetails();
        // this.getLEDPanel();
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
                    tempData.forEach(function (d) {
                        d.time = parseTime(d.time);
                        d.value = parseFloat(d.value);
                    })
                    console.log("Data", tempData)
                    this.setState({'temp_data': tempData})
                    // this.setState({'rh_data': responseJson["results"]['RH']})
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    //
    // getLEDPanel() {
    //     return fetch('http://food.computer.com:5000/api/get_led_panel/', {
    //         method: 'POST',
    //         headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json',
    //             'Access-Control-Allow-Origin': '*'
    //         }
    //     })
    //         .then((response) => response.json())
    //         .then((responseJson) => {
    //             console.log(responseJson)
    //             if (responseJson["response_code"] == 200) {
    //                 console.log("led panel", responseJson["results"])
    //             }
    //
    //         })
    //         .catch((error) => {
    //             console.error(error);
    //         });
    // }
    //

    render() {
        const margin = {top: 20, right: 20, bottom: 30, left: 50};

        return (
            <div className="plot-container">
                <div className="row">
                    <div className="col-md-5">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card value-card">
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
                                <div className="card value-card">
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
                                <div className="card value-card">
                                    <div className="card-block">
                                        <h4 className="card-title"> LED Panel </h4>
                                        <div className="card-text">
                                            <div className="graph">

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
                                <AxisX width={600} height={450} margin={margin} data={this.state.temp_data}/>
                                <AxisY width={600} height={450} margin={margin} data={this.state.temp_data}/>
                                <Line width={600} height={450} margin={margin} data={this.state.temp_data}/>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
        )

    }
}

export default withCookies(DeviceHomepage);

