import React, {Component} from 'react';
import '../css/App.css';
import '../css/login.css';
import {Cookies, withCookies} from "react-cookie";
// import Plot from 'react-plotly.js';
// import rd3 from 'react-d3';

class DeviceHomepage extends Component {
    constructor(props) {
        super(props);
        this.state ={
            'temp_panel':[],
            'led_panel':[]
        }
        this.getTempDetails = this.getTempDetails.bind(this)
        this.getLEDPanel = this.getLEDPanel.bind(this)

    }
    componentDidMount()
    {
        this.getTempDetails();
        this.getLEDPanel();
    }
    getTempDetails()
    {
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
                    console.log("temp humidity",responseJson["results"])
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    getLEDPanel()
    {
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
                    console.log("led panel",responseJson["results"])
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {
        return (<div>Hello</div>)
    }
}

export default withCookies(DeviceHomepage);
