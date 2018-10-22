import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../scss/profile.scss';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import {ImageUploader} from './components/image_uploader';
import edit_icon from "../images/pencil-edit-button.png";

import * as api from './utils/api';

import discourse_icon from "../images/discourse.png"

class profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            access_code_modal: false,
            user_devices: [],
            get_devices_status: 'Loading',
            code: "",
            profile_picture_url: '',
            username: '',
            email_address: '',
            organization: '',
            edit_profile: false,
            permissions: [],
            twitter_hashtag: 'OpenAgPFCEDU2018',
            discourse_modal: false,
            discourse_username: '',
            discourse_user: {},
            device_selected_to_share: null,
            share_device_modal: false,
            discourse_key:''
        };

    }

    componentDidMount() {
        this.getUserDevices();
        this.getUserInfo();
    }



    inputChange=(event) => {
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


    connectDiscourse=()=>{
        let discourse_topic_url = "https://forum.openag.media.mit.edu/admin/users/2292/"
        return fetch(discourse_topic_url + "generate_api_key.json?api_key=653f5234f76316463e1784329128832ea296f87d3a29590290b2307ac6c2b892&api_username=openag", {
            method: 'POST'
        })
            .then(response => response.json())
            .then(responseJson => {
                this.setState({discourse_modal: false})
                this.saveAPIKey(responseJson["api_key"]["key"])
                this.setState({discourse_key:responseJson["api_key"]["key"]})
            })
            .catch(error => {
                console.error(error);
            })
    }

    getUserDiscourseId=()=>{
        let discourse_topic_url = "https://forum.openag.media.mit.edu/admin/users/2292/"
        return fetch(discourse_topic_url + "generate_api_key.json?api_key=653f5234f76316463e1784329128832ea296f87d3a29590290b2307ac6c2b892&api_username=openag", {
            method: 'POST'
        })
            .then(response => response.json())
            .then(responseJson => {
                this.setState({discourse_modal: false})
                this.saveAPIKey(responseJson["api_key"]["key"])
                this.setState({discourse_key:responseJson["api_key"]["key"]})
            })
            .catch(error => {
                console.error(error);
            })
    }

    saveAPIKey=(discourse_key)=>{
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/save_forum_api_key/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'discourse_key':discourse_key,
                "api_username":this.state.username

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

    toggle_discourse_modal=()=>{
        this.setState({discourse_modal: !this.state.discourse_modal})
    }


    saveUserProfile=()=>{

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

    getUserDevices=()=> {
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

    handleChange=(group_name, event)=>{
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

    handleInputChange=(event)=>{
        this.setState({[event.target.name]: event.target.value});
    }

    onImageUpload=(response)=>{
        if (response.response_code == 200) {
            this.setState({profile_picture_url: response.url});
        } else {
            console.error('Image upload failed');
        }
    }

    shareDevice=(device, e)=>{
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
                                <div className="col-md-4 no-padding"><Button className="edit-button-full btn btn-loading"
                                                                  onClick={this.shareDevice.bind(this, device)} disabled>
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

                                    </div>
                                </div>

                            </div>
                            <div className="col-md-8">

                                <form onSubmit={this.saveUserProfile}>

                                    <div className="row profile-row">
                                        <div className="col-md-12"> {this.state.edit_profile ? <div className="wrapper">
                                            <div className="row padded-row">
                                                <div className="col-md-4">Farmer Name :</div>
                                                <div className="col-md-4"><Input className="profile-input"
                                                                                 value={this.state.username} type="text"
                                                                                 name="username"
                                                                                 onChange={this.inputChange} required/>
                                                </div>
                                            </div>
                                            <div className="row padded-row">
                                                <div className="col-md-4">Farm Name:</div>
                                                <div className="col-md-4"><Input className="profile-input"
                                                                                 value={this.state.twitter_hashtag}
                                                                                 type="text"
                                                                                 name="twitter_hashtag"
                                                                                 onChange={this.inputChange} required/>
                                                </div>
                                            </div>
                                            <div className="row padded-row">
                                                <div className="col-md-4">School/Library:</div>
                                                <div className="col-md-4"><Input className="profile-input"
                                                                                 value={this.state.organization}
                                                                                 type="text"
                                                                                 name="organization"
                                                                                 onChange={this.inputChange}/></div>
                                            </div>
                                            <div className="row padded-row">
                                                <div className="col-md-4"> Email Address:</div>
                                                <div className="col-md-4"><Input className="profile-input"
                                                                                 value={this.state.email_address}
                                                                                 type="email"
                                                                                 name="email_address"
                                                                                 onChange={this.inputChange} required/>
                                                </div>
                                            </div>

                                        </div> : <div className="wrapper">
                                            <div className="row padded-row">
                                                <div className="col-md-4">Farmer Name :</div>
                                                <div className="col-md-4">{this.state.username}</div>


                                            </div>
                                            <div className="row padded-row">
                                                <div className="col-md-4"> Farm Name <sup><span
                                                    title="Used for all social media posts"> ? </span></sup> :</div>
                                                <div className="col-md-4">{this.state.twitter_hashtag}</div>

                                            </div>
                                            <div className="row padded-row">
                                                <div className="col-md-4"> School/Library :</div>
                                                <div className="col-md-4">{this.state.organization}</div>

                                            </div>
                                            <div className="row padded-row">
                                                <div className="col-md-4">Email Address :</div>
                                                <div className="col-md-4">{this.state.email_address}</div>

                                            </div>


                                        </div>}</div>


                                    </div>
                                </form>

                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-4">
                                <div className="row">
                                    <div className="wrapper">
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
                                <div className="row">
                                    <div className="col-md-4"></div>
                                    <div className="col-md-4"></div>
                                    <div className="col-md-4 pull-right no-padding-right">
                                        {this.state.discourse_key === '' ?<Button className="edit-button-full"
                                                onClick={this.toggle_discourse_modal} title='Coming Soon'  ><img src={discourse_icon}
                                                                                           height="30"/> Connect
                                            Forum</Button>:<Button className="edit-button-full"
                                               title='Coming Soon'  ><img src={discourse_icon}
                                                                                           height="30"/>Connected</Button>}
                                    </div>
                                </div>
                                <div className="row profile-row">
                                    <div className="col-md-4"></div>
                                    <div className="col-md-4"></div>

                                    <div className="col-md-4 pull-right no-padding-right">
                                        {this.state.edit_profile ?
                                            <Button className="edit-button" onClick={this.saveUserProfile}>
                                                Save
                                            </Button>
                                            :
                                            <Button className="edit-button"
                                                    onClick={this.toggleEditProfile}>
                                                <img className="small-pad" src={edit_icon} height="30"/> Edit Profile
                                            </Button>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



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


                <Modal isOpen={this.state.discourse_modal} toggle={this.toggle_discourse_modal}>
                    <ModalHeader toggle={this.toggle_discourse_modal}><i>Discourse Username</i></ModalHeader>
                    <ModalBody>
                        <Input placeholder="Enter your discourse username" name="discourse_username"
                               onChange={this.handleInputChange}/>

                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.connectDiscourse}>Submit</Button>
                        <Button color="secondary" onClick={this.toggle_discourse_modal}>Cancel</Button>
                    </ModalFooter>
                </Modal>
            </div>
        )
    }
}

export default withCookies(profile);
