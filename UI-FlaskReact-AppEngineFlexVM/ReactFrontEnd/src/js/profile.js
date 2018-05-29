import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../css/profile.css';
import {Button} from 'reactstrap';


class profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user_devices: []
        };
        this.getUserDevices = this.getUserDevices.bind(this);
    }

    componentDidMount() {
        this.getUserDevices()
    }
    createNewCode()
    {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/create_new_code/', {
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
                    console.log("Response", responseJson["results"])
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
                    this.setState({user_devices: responseJson["results"]})
                    console.log("Response", responseJson["results"])
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {

        let listDevices = <p>Loading</p>
        if (this.state.user_devices.length > 0) {
            listDevices = this.state.user_devices.map((device) => {
                return <div className="row profile-card-row" key={device.device_uuid}>{device.device_name}</div>
            });
        }

        return (
            <div className="profile-container">
                <div className="row">
                    <div className="col-md-4">
                        <div className="row">
                            <div className="wrapper">
                                <img src="https://i.kinja-img.com/gawker-media/image/upload/gd8ljenaeahpn0wslmlz.jpg"
                                     className="image--cover"/>
                            </div>
                        </div>
                        <div className="row profile-row">
                            <div className="wrapper">
                                <div className="row">
                                    Manvitha Ponnapati
                                </div>
                                <div className="row">
                                    manvitha@mit.edu
                                </div>
                                <div className="row">
                                    OpenAg Initiative
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="col-md-4">
                        <div className="card profile-card">
                            <div className="card-body">
                                <div className="row"> <h3>My Devices </h3>  </div>
                                {listDevices}
                                <div className="row"><Button onClick={this.createNewCode}>Create Student Code</Button></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">

                    </div>
                </div>
            </div>
        )
    }
}

export default withCookies(profile);
