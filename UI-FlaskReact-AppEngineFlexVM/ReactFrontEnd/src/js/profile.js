import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../scss/profile.scss';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import {ImageUploader} from './components/image_uploader';
import {CreateAccessCodeModal} from './components/create_access_code_modal.js';

import * as api from './utils/api';

class profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            access_code_modal: false,
            user_devices: [],
            get_devices_status: 'Loading',
            digit_modal: false,
            code: "",
            profile_picture_url: '',
            username: '',
            email_address: '',
            organization: '',
            edit_profile: false
        };
        this.getUserDevices = this.getUserDevices.bind(this);
        this.toggle_digit_modal = this.toggle_digit_modal.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onImageUpload = this.onImageUpload.bind(this);
        this.toggleEditProfile = this.toggleEditProfile.bind(this)
        this.inputChange = this.inputChange.bind(this)
        this.saveUserProfile = this.saveUserProfile.bind(this);
    }

    componentDidMount() {
        this.getUserDevices();
        this.getUserInfo();
    }

    inputChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
        event.preventDefault();

    }

    toggleEditProfile() {
        this.setState({edit_profile: !this.state.edit_profile})
    }

    toggleAccessCodeModal = () => {
        this.setState(prevState => {
            return {access_code_modal: !prevState.access_code_modal};
        })
    }

    toggle_digit_modal() {
        this.setState({digit_modal: !this.state.digit_modal})
    }

    createAccessCode = (modal_state) => {
        let permissions = [];
        for (const device_uuid in modal_state) {
            const permission = modal_state[device_uuid];
            if (permission != 'control' && permission != 'view') continue;
            permissions.push({
                device_uuid: device_uuid,
                permission: permission
            });
        }
        const permissions_json = JSON.stringify(permissions);

        return fetch(process.env.REACT_APP_FLASK_URL + '/api/create_new_code/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'permissions': permissions_json
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {

                    console.log("Response", responseJson["results"])
                    this.toggleAccessCodeModal();
                    this.setState({code: responseJson["code"]})
                    this.setState({digit_modal: true})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    saveUserProfile() {
        this.setState({edit_profile: !this.state.edit_profile})
        window.location.reload()
        // return fetch(process.env.REACT_APP_FLASK_URL + '/api/save_user_profile_changes/', {
        //     method: 'POST',
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json',
        //         'Access-Control-Allow-Origin': '*'
        //     },
        //     body: JSON.stringify({
        //         'user_uuid': this.state.user_uuid,
        //         'user_token': this.props.cookies.get('user_token'),
        //         'username':this.state.username,
        //         'email_address':this.state.email_address,
        //         'organization':this.state.organization
        //     })
        // })
        //     .then((response) => response.json())
        //     .then((responseJson) => {
        //         console.log(responseJson)
        //         this.setState({edit_profile:!this.state.edit_profile})
        //     })
        //     .catch((error) => {
        //         console.error(error);
        //     });

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
                } else {
                    this.setState({get_devices_status: 'No Devices'});
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    getUserInfo = () => {
        api.getUserInfo(this.props.cookies.get('user_token'))
            .then(response => {
                this.setState({
                    profile_picture_url: response.profile_image,
                    email_address: response.email_address,
                    username: response.username,
                    organization: response.organization
                })
            });
    }

    handleChange(group_name, event) {
        if (group_name === "device_permissions") {
            console.log(event.target.name)
            this.setState({[event.target.name]: event.target.checked});
            event.preventDefault();
        }
        else {
            this.setState({[event.target.name]: event.target.value});
            event.preventDefault();
        }
    }

    onImageUpload(response) {
        if (response.response_code == 200) {
            this.setState({profile_picture_url: response.url});
        } else {
            console.error('Image upload failed');
        }
    }

    render() {

        let listDevices = <p>{this.state.get_devices_status}</p>
        if (this.state.user_devices.length > 0) {
            listDevices = this.state.user_devices.map((device) => {
                return <div className="row profile-card-row" key={device.device_uuid}>
                    <div className="col-md-8">{device.device_name}</div>
                </div>
            });
        }

        let listShareDevices = <p>Loading</p>
        if (this.state.user_devices.length > 0) {
            listShareDevices = this.state.user_devices.map((device) => {
                return <div className="row profile-card-row" key={device.device_uuid}>
                    <div className="col-md-8">{device.device_name}</div>
                    <div className="col-md-2 col-center-label"><Input type="checkbox" aria-label="View"
                                                                      name={'view_' + device.device_uuid}
                                                                      id={'view_' + device.device_uuid}
                                                                      checked={this.state['view_' + device.device_uuid]}
                                                                      onChange={this.handleChange.bind(this, "device_permissions")}/>
                    </div>
                    <div className="col-md-2 col-center-label"><Input type="checkbox" aria-label="Control"
                                                                      name={'control_' + device.device_uuid}
                                                                      id={'control_' + device.device_uuid}
                                                                      checked={this.state['control_' + device.device_uuid]}
                                                                      onChange={this.handleChange.bind(this, "device_permissions")}/>
                    </div>
                </div>
            });
        }

        return (
            <div className="profile-container">
                <div className="row">
                    <div className="col-md-4">
                        <div className="row">
                            <div className="wrapper">
                                <img src={this.state.profile_picture_url}
                                     className="image--cover"/>
                                <ImageUploader
                                    url={process.env.REACT_APP_FLASK_URL + "/api/upload_images/"}
                                    data={{
                                        type: 'user',
                                        user_token: this.props.cookies.get('user_token')
                                    }}
                                    onDone={this.onImageUpload}
                                    className="image-uploader"/>
                            </div>
                        </div>
                        <div className="row profile-row">
                            {this.state.edit_profile ?
                                <Button className="save-button" onClick={this.saveUserProfile}>Save</Button> :
                                <Button className="edit-button" onClick={this.toggleEditProfile}>Edit</Button>}
                        </div>
                        <div className="row profile-row">
                            {this.state.edit_profile ? <div className="wrapper">
                                <div className="row">
                                    Username : <input className="profile-input" value={this.state.username}
                                                      name="username" onChange={this.inputChange}/>
                                </div>
                                <div className="row">
                                    Email Address: <input className="profile-input" value={this.state.email_address}
                                                          name="email_address" onChange={this.inputChange}/>
                                </div>
                                <div className="row">
                                    Organization: <input className="profile-input" value={this.state.organization}
                                                         name="organization" onChange={this.inputChange}/>
                                </div>
                            </div> : <div className="wrapper">
                                <div className="row">
                                    {this.state.username}
                                </div>
                                <div className="row">
                                    {this.state.email_address}
                                </div>
                                <div className="row">
                                    {this.state.organization}
                                </div>
                            </div>}

                        </div>

                    </div>
                    <div className="col-md-4">
                        <div className="card profile-card">
                            <div className="card-body">
                                <div className="row"><h3>My Devices </h3></div>
                                {listDevices}
                                <div className="row"><h3>Sharing </h3></div>
                                <div className="row profile-card-row"><Button color="link"
                                                                              onClick={this.toggleAccessCodeModal}>Create
                                    Access Code</Button></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">

                    </div>
                </div>

                <CreateAccessCodeModal
                    isOpen={this.state.access_code_modal}
                    toggle={this.toggleAccessCodeModal}
                    onSubmit={this.createAccessCode}
                    devices={this.state.user_devices}
                />

                <Modal isOpen={this.state.digit_modal} toggle={this.toggle_digit_modal}
                       className={this.props.className}>
                    <ModalHeader toggle={this.toggle_access_code_modal}><i>6-Digit Access Code</i></ModalHeader>
                    <ModalBody>
                        <h1 className="centered-header"> {this.state.code} </h1>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.toggle_digit_modal}>Close</Button>
                    </ModalFooter>
                </Modal>
            </div>
        )
    }
}

export default withCookies(profile);
