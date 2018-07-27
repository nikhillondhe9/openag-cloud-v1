import React, {Component} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import '../scss/home.scss';
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
import placeholder from "../images/no-image.png";
import notification from '../images/notification.png';
import {Timeline} from 'react-twitter-widgets'

import {ImageTimelapse} from './components/image_timelapse';
import {DevicesDropdown} from './components/devices_dropdown';
import {AddDeviceModal} from './components/add_device_modal';
import {AddAccessCodeModal} from './components/add_access_code_modal';

import * as api from './utils/api';

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
            user_devices: new Map(),
            selected_device: 'Loading',
            device_images: [placeholder],
            current_plant_type: '',
            current_recipe_runtime: ''
        };

        // This binding is necessary to make `this` work in the callback
        this.getUserDevices = this.getUserDevices.bind(this);
        this.postToTwitter = this.postToTwitter.bind(this);
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

    getDeviceImages(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_device_images/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_uuid': device_uuid
            })
        })
            .then(response => response.json())
            .then(responseJson => {
                this.setState({
                    device_images: responseJson['image_urls']
                });
            })
            .catch(error => {
                console.error(error);
            })
    }

    getCurrentRecipeInfo(device_uuid) {
        api.getCurrentRecipeInfo(
            this.props.cookies.get('user_token'),
            device_uuid
        ).then(response => {
            console.log(response,"SS")
            this.setState({
                current_recipe_uuid:response.uuid,
                current_plant_type: response.plant_type,
                current_recipe_runtime: response.runtime
            })
        });
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
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    const devices = responseJson["results"];
                    let devices_map = new Map();
                    for (const device of devices) {
                        devices_map.set(device['device_uuid'], device);
                    }

                    this.setState({
                        user_devices: devices_map
                    }, () => {
                        if (!this.restoreSelectedDevice()) {
                            // default the selected device to the first/only dev.
                            this.onSelectDevice(devices[0].device_uuid)
                        }
                    });
                    console.log("Response", responseJson["results"])
                } else {
                    this.setState({
                        selected_device: 'No Devices',
                        selected_device_uuid: ''
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    restoreSelectedDevice = () => {
        const saved_device_uuid = this.props.cookies.get('selected_device_uuid', {path: '/'});
        if (!saved_device_uuid) return;

        const device = this.state.user_devices.get(saved_device_uuid);
        if (device) {
            this.onSelectDevice(saved_device_uuid);
            return true;
        }
        return false;
    }

    saveSelectedDevice = () => {
        const selected_device_uuid = this.state.selected_device_uuid;
        console.log(selected_device_uuid);
        if (selected_device_uuid) {
            this.props.cookies.set('selected_device_uuid', selected_device_uuid, {path: '/'});
        } else {
            this.props.cookies.remove('selected_device_uuid', {path: '/'});
        }
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

    onSelectDevice = (device_uuid) => {
        if (device_uuid != this.state.selected_device_uuid) {
            const device = this.state.user_devices.get(device_uuid);
            const name = `${device.device_name} (${device.device_reg_no})`;
            this.setState({
                selected_device: name,
                selected_device_uuid: device.device_uuid
            }, () => {
                this.getCurrentRecipeInfo(device_uuid);
                this.saveSelectedDevice();
                this.getDeviceImages(device_uuid);
            });
        }
    }

    render() {
        console.log(this.state.selected_device_uuid,"FDFD")
        let gotohistory = "/recipe_history/"+this.state.selected_device_uuid+"/"+this.state.current_recipe_uuid;
        return (
            <Router>
                <div className="home-container">
                    <DevicesDropdown
                        devices={[...this.state.user_devices.values()]}
                        selectedDevice={this.state.selected_device}
                        onSelectDevice={this.onSelectDevice}
                        onAddDevice={this.toggleDeviceModal}
                        onAddAccessCode={this.toggleAccessCodeModal}
                    />
                    <Button className="postbutton" onClick={this.postToTwitter}>
                        Post status to twitter
                    </Button>
                    <div className="card notifications">
                        <div className="card-body">
                            <div className="card-title">
                                <h3>Notifications</h3>
                                <img src={notification}/>
                            </div>
                            {this.state.current_plant_type ? (
                                <p>
                                    Your {this.state.current_plant_type} is {this.state.current_recipe_runtime}
                                    &nbsp;old. Congratulations!
                                </p>
                            ) : (
                                <p>
                                    Loading recipe information.
                                </p>
                            )}
                            <hr/>
                            <p> <a href={gotohistory}>See edits </a> to your recipes  </p>
                            <hr/>
                            <p> Water needs refilling soon </p>
                        </div>
                    </div>
                    <div className="timelapse">
                        <ImageTimelapse
                            imageClass="timelapse-img"
                            inputClass="range-slider__range"
                            images={this.state.device_images}
                        />
                    </div>
                    <div className="status">
                        <div>Status: Good</div>
                        <div>Temperature: 25&#8451;</div>
                    </div>
                    <div className="twitter">
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
