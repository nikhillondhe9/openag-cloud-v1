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
            edit_profile: false,
            twitter_hashtag: 'OpenAgPFCEDU2018',
            discourse_modal: false,
            discourse_username: '',
            discourse_user: {},
            device_selected_to_share: null,
            share_device_modal: false
        };
        this.getUserDevices = this.getUserDevices.bind(this);
        this.toggle_digit_modal = this.toggle_digit_modal.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onImageUpload = this.onImageUpload.bind(this);
        this.inputChange = this.inputChange.bind(this)
        this.saveUserProfile = this.saveUserProfile.bind(this);
        this.connectDiscourse = this.connectDiscourse.bind(this);
        this.toggle_discourse_modal = this.toggle_discourse_modal.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.generateAPIKey = this.generateAPIKey.bind(this)
        this.shareDevice = this.shareDevice.bind(this)
        this.toggleShareDeviceModal = this.toggleShareDeviceModal.bind(this)
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

    toggleEditProfile = (e) => {
        e.preventDefault();
        this.setState({edit_profile: !this.state.edit_profile})
    }

    toggleAccessCodeModal = () => {
        this.setState(prevState => {
            return {access_code_modal: !prevState.access_code_modal};
        })
    }

    toggleShareDeviceModal() {
        this.setState(prevState => {
            return {share_device_modal: this.state.share_device_modal};
        })
    }

    toggle_digit_modal() {
        this.setState({digit_modal: !this.state.digit_modal})
    }

    connectDiscourse() {
        this.setState({discourse_modal: false});
        let discourse_topic_url = "https://forum.openag.media.mit.edu/users/"
        return fetch(discourse_topic_url + "ManvithaPonnapati" + ".json?api_key=5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394&api_username=openag", {
            method: 'GET'
        })
            .then(response => response.json())
            .then(responseJson => {

                this.setState({discourse_user: responseJson["user"]})
                this.generateAPIKey()
            })
            .catch(error => {
                console.error(error);
            })
    }

    generateAPIKey() {
        console.log(this.state.discourse_user, "Ds")
        let admin_api_key = "5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394"
        return fetch("https://forum.openag.media.mit.edu/admin/users/" + this.state.discourse_user["id"] + "/generate_api_key",
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    "api_key": admin_api_key,
                    "id": this.state.discourse_user["id"]
                })
            })
            .then(response => response.json())
            .then(responseJson => {
                let user = responseJson["user"]["id"]
            })
            .catch(error => {
                console.error(error);
            })
    }

    toggle_discourse_modal() {
        this.setState({discourse_modal: !this.state.discourse_modal})
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

        return fetch(process.env.REACT_APP_FLASK_URL + '/api/save_user_profile_changes/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'username': this.state.username,
                'email_address': this.state.email_address,
                'organization': this.state.organization
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                this.setState({edit_profile: !this.state.edit_profile})
                window.location.reload()
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
                    this.setState({user_devices: responseJson["results"]["devices"]})
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

    handleInputChange(event) {
        this.setState({[event.target.name]: event.target.value});
    }

    onImageUpload(response) {
        if (response.response_code == 200) {
            this.setState({profile_picture_url: response.url});
        } else {
            console.error('Image upload failed');
        }
    }

    shareDevice(device, e) {
        this.setState({device_selected_to_share: device})
        this.setState({share_device_modal: true})
    }

    render() {

        let listDevices = <p>{this.state.get_devices_status}</p>
        if (this.state.user_devices.length > 0) {
            listDevices = this.state.user_devices.map((device) => {
                return <div className="each-device-div" key={device.device_uuid}>
                    <div className="row device-row">
                        <div className="col-md-4">Device Name:</div>
                        <div className="col-md-4">{device.device_name}</div>
                    </div>
                    <div className="row device-row">
                        <div className="col-md-4">Device Description:</div>
                        <div className="col-md-4">{device.device_notes}</div>
                    </div>
                    <div className="row device-row">
                        <div className="col-md-4">Shared with:</div>
                        <div className="col-md-4">
                            <div className="row">
                                <div className="col-md-4">N/A</div>
                            </div>
                            <div className="row">
                                <div className="col-md-4"><Button className="edit-button-add"
                                                                  onClick={this.shareDevice.bind(this, device)}>
                                    Add User</Button></div>
                            </div>
                        </div>
                    </div>

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
                <div className="card profile-card">
                    <div className="card-body">
                        <div className="card-title">
                            <div className="row">
                                <div className="col-md-4"><h2>My Info</h2></div>
                            </div>
                        </div>
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

                            </div>
                            <div className="col-md-8">

                                <form onSubmit={this.saveUserProfile}>

                                    <div className="row profile-row">
                                        <div className="col-md-12"> {this.state.edit_profile ? <div className="wrapper">
                                            <div className="row">
                                                Username :
                                                <input className="profile-input" value={this.state.username} type="text"
                                                       name="username" onChange={this.inputChange} required/>
                                            </div>
                                            <div className="row">
                                                Email Address:
                                                <input className="profile-input" value={this.state.email_address}
                                                       type="email"
                                                       name="email_address" onChange={this.inputChange} required/>
                                            </div>
                                            <div className="row">
                                                Organization:
                                                <input className="profile-input" value={this.state.organization}
                                                       type="text"
                                                       name="organization" onChange={this.inputChange}/>
                                            </div>
                                            <div className="row">
                                                Twitter Hashtag:
                                                <input className="profile-input" value={this.state.twitter_hashtag}
                                                       type="text"
                                                       name="twitter_hashtag" onChange={this.inputChange} required/>
                                            </div>
                                        </div> : <div className="wrapper">
                                            <div className="row">
                                                <div className="col-md-4">Farmer Name :</div>
                                                <div className="col-md-4">{this.state.username}</div>

                                            </div>
                                            <div className="row">
                                                <div className="col-md-4">Email Address :</div>
                                                <div className="col-md-4">{this.state.email_address}</div>

                                            </div>
                                            <div className="row">
                                                <div className="col-md-4"> School Library :</div>
                                                <div className="col-md-4">{this.state.organization}</div>

                                            </div>
                                            <div className="row">
                                                <div className="col-md-4"> Farm Name :</div>
                                                <div className="col-md-4">{this.state.twitter_hashtag}<sup><span
                                                    title="Used for all social media posts"> ? </span></sup></div>

                                            </div>
                                            <div className="row">
                                                <div className="col-md-4"></div>
                                                <div className="col-md-4"></div>
                                                <div className="col-md-4 pull-right">
                                                    <Button className="edit-button"
                                                            onClick={this.toggle_discourse_modal}>Connect
                                                        Forum</Button>
                                                </div>
                                            </div>
                                            <div className="row profile-row">
                                                <div className="col-md-4"></div>
                                                <div className="col-md-4"></div>

                                                <div className="col-md-4 pull-right">
                                                    {this.state.edit_profile ?
                                                        <Button className="edit-button">
                                                            Save
                                                        </Button>
                                                        :
                                                        <Button className="edit-button"
                                                                onClick={this.toggleEditProfile}>
                                                            Edit Profile
                                                        </Button>
                                                    }
                                                </div>
                                            </div>
                                        </div>}</div>


                                    </div>
                                </form>

                            </div>
                        </div>
                    </div>
                </div>


                <CreateAccessCodeModal
                    isOpen={this.state.access_code_modal}
                    toggle={this.toggleAccessCodeModal}
                    onSubmit={this.createAccessCode}
                    devices={this.state.user_devices}
                />
                <div className="card profile-card">
                    <div className="card-title">
                        <div className="row padded-left">
                            <div className="col-md-4"><h2>My PFCs</h2></div>
                        </div>
                    </div>
                    <div className="card-body">

                        {listDevices}
                    </div>
                </div>
                <Modal isOpen={this.state.share_device_modal} toggle={this.toggleShareDeviceModal}
                       className={this.props.className} size={"lg"}>
                    <ModalHeader toggle={this.toggleShareDeviceModal}>Add User</ModalHeader>
                    <ModalBody>
                        <div className="row modal-input-row">
                            <div className="col-md-3">Name</div>
                            <div className="col-md-9">
                                <Input type="text" placeholder="Caleb"/>
                            </div>
                        </div>
                        <div className="row modal-input-row">
                            <div className="col-md-3">Email</div>
                            <div className="col-md-9">
                                <Input type="text" placeholder="example@domain.com"/>
                            </div>
                        </div>
                        <div className="row modal-input-row">
                            <div className="col-md-3">Access</div>
                            <div className="col-md-9">
                                <div className="row">
                                    <div className="col-md-4">
                                        <ul><Input type="checkbox"/> Full User</ul>
                                    </div>

                                    <div className="col-md-4">
                                        <ul><Input type="checkbox"/> Secondary User</ul>
                                    </div>
                                    <div className="col-md-4">
                                        <ul><Input type="checkbox"/> Student User</ul>
                                    </div>

                                </div>
                                <div className="row">
                                    <div className="col-md-4 border-right">
                                        <ul>
                                            <li>Can add users</li>
                                            <li>Can change profile name and email</li>
                                            <li>Can edit Climate Recipe</li>
                                            <li>Can use social platforms</li>
                                        </ul>
                                    </div>
                                    <div className="col-md-4 border-right">
                                        <ul>
                                            <li>Cannot add users</li>
                                            <li>Can change profile name and email</li>
                                            <li>Can edit Climate Recipe</li>
                                            <li>Can use social platforms</li>
                                        </ul>
                                    </div>
                                    <div className="col-md-4">
                                        <ul>
                                            <li>No Sharing</li>
                                            <li>Change Profile Name/Email</li>
                                            <li>No Changes to Climate Recipe</li>
                                            <li>No Access to Farmer Connect</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="edit-button">Submit</Button>
                    </ModalFooter>
                </Modal>

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

                <Modal isOpen={this.state.discourse_modal} toggle={this.toggle_discourse_modal}>
                    <ModalHeader toggle={this.toggle_discourse_modal}><i>Discourse Username</i></ModalHeader>
                    <ModalBody>
                        <Input placeholder="Enter your discourse username" name="discourse_username"
                               onChange={this.handleInputChange}/>

                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.connectDiscourse}>Submit</Button>
                    </ModalFooter>
                </Modal>
            </div>
        )
    }
}

export default withCookies(profile);
