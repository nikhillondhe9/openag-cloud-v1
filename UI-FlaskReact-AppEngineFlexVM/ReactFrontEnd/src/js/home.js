import React, {Component} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import '../css/home.css';
import {
    Button,
    Form,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader
} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";
import image1 from '../images/1.jpg';
import image2 from '../images/2.jpg';
import image3 from '../images/3.jpg';
import image4 from '../images/4.jpg';
import image5 from '../images/5.jpg';
import image6 from '../images/6.jpg';
import image7 from '../images/7.jpg';
import notification from '../images/notification.png';
import {Timeline} from 'react-twitter-widgets'

import {ImageTimelapse} from './components/image_timelapse';
import {DevicesDropdown} from './components/devices_dropdown';
import {AddDeviceModal} from './components/add_device_modal';
import {AddAccessCodeModal} from './components/add_access_code_modal';

class Home extends Component {
    constructor(props) {
        super(props);
        this.user_uuid = this.props.location.pathname.replace("/home/", "").replace("#", "")
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            add_device_modal: false,
            add_device_error_message: '',
            add_access_modal: false,
            access_code_error_message: '',
            user_uuid: this.user_uuid,
            user_devices: [],
            selected_device: 'Loading'
        };

        // This binding is necessary to make `this` work in the callback
        this.getUserDevices = this.getUserDevices.bind(this);
        this.postToTwitter = this.postToTwitter.bind(this);
        this.onSelectDevice = this.onSelectDevice.bind(this);
    }

    componentWillMount() {
        if (this.props.cookies.get('user_token') === '' || this.props.cookies.get('user_token') === undefined || this.props.cookies.get('user_token') === "undefined") {
            window.location.href = "/login"
        }
    }

    componentDidMount() {
        console.log("Mouting component")
        this.getUserDevices()
    }

    getUserDevices() {
        console.log(process.env.REACT_APP_FLASK_URL, "X")
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
                    console.log("Response", responseJson["results"])
                } else {
                    this.setState({selected_device: 'No Devices'});
                }
            })
            .catch((error) => {
                console.error(error);
            });
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
        console.log(modal_state);
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
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
                    })
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
                'user_token': this.props.cookies.get('user_token'),
                'access_code': modal_state.access_code
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
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

    goToDeviceHomePage(device_uuid) {
        console.log(device_uuid, "UU")
        if (device_uuid) {
            window.location.href = "/device/" + device_uuid.toString();
        }
    }

    postToTwitter() {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/posttwitter/', {
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
                // if (responseJson["response_code"] == 200) {
                //     // this.setState({user_devices: responseJson["results"]})
                // }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    onSelectDevice(e) {
        this.setState({selected_device: e.target.textContent});
    }

    render() {
        return (
            <Router>
                <div className="home-container">
                    <div className="row dropdown-row">
                        <div className="col-md-6">
                            <DevicesDropdown
                                devices={this.state.user_devices}
                                selectedDevice={this.state.selected_device}
                                onSelectDevice={this.onSelectDevice}
                                onAddDevice={this.toggleDeviceModal}
                                onAddAccessCode={this.toggleAccessCodeModal}
                            />
                        </div>
                        <div className="col-md-6">
                            <Button className="postbutton" onClick={this.postToTwitter}>Post status to twitter</Button>
                        </div>
                    </div>


                    <div className="row">

                        <div className="col-md-3">
                            <div className="card notifications-card">
                                <div className="card-title">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <h3>Notifications </h3>
                                        </div>
                                        <div className="col-md-4">
                                            <img src={notification} className="notification-img"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-12">
                                            <p> Your Basil is 3 weeks old. Congratulations! </p>
                                        </div>
                                    </div>
                                    <hr/>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <p> <a href="#">See edits </a> to your recipes  </p>
                                        </div>
                                    </div>
                                    <hr/>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <p> Water needs refilling soon </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="col-md-5">
                            <ImageTimelapse
                                imageClass="timelapse-img"
                                inputClass="range-slider__range"
                                images={[image1, image2, image3, image4, image5, image6, image7]}/>
                            <div className="row status-row">
                                <div className="status-col">
                                    Status : Good
                                </div>
                            </div>
                            <div className="row">
                                <div className="status-col">
                                    Temp :
                                </div>
                            </div>
                            <div className="row">
                                <div className="status-col">
                                    Next Manual Nutrient Dosing :
                                </div>
                            </div>

                        </div>
                        <div className="col-md-4 twitter-col">
                            <Timeline
                                dataSource={{
                                    sourceType: 'profile',
                                    screenName: 'food_computer'
                                }}
                                options={{
                                    username: 'FoodComputer'
                                }}
                                onLoad={() => console.log('Timeline is loaded!')}
                            />
                        </div>
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
            </Router>



        );
    }
}

export default withCookies(Home);
