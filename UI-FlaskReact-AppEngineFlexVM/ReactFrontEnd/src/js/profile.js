import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../css/profile.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import {ImageUploader} from './components/image_uploader';

class profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            access_code_modal: false,
            user_devices: [],
            digit_modal: false,
            code: "",
            profile_picture_url: ""
        };
        this.getUserDevices = this.getUserDevices.bind(this);
        this.getUserImage = this.getUserImage.bind(this);
        this.toggle_access_code_modal = this.toggle_access_code_modal.bind(this);
        this.get_device_code = this.get_device_code.bind(this);
        this.toggle_digit_modal = this.toggle_digit_modal.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onImageUpload = this.onImageUpload.bind(this);
    }

    componentDidMount() {
        this.getUserDevices()
        this.getUserImage();
    }

    toggle_access_code_modal() {
        this.setState({access_code_modal: !this.state.access_code_modal})
    }

    toggle_digit_modal() {
        this.setState({digit_modal: !this.state.digit_modal})
    }

    get_device_code() {
        console.log(this.state)
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/create_new_code/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'state':this.state
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {

                    console.log("Response", responseJson["results"])
                    this.setState({code: responseJson["code"]})
                    this.setState({access_code_modal: false})
                    this.setState({digit_modal: true})
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

    getUserImage() {
        fetch(process.env.REACT_APP_FLASK_URL + '/api/get_user_image/', {
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
            .then((response) => {
                console.log(response);
                return response.json();
            })
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson['response_code'] == 200) {
                    this.setState({profile_picture_url: responseJson['url']})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    handleChange(group_name,event) {
        if(group_name==="device_permissions") {
            console.log(event.target.name)
            this.setState({[event.target.name]: event.target.checked});
            event.preventDefault();
        }
        else
        {
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

        let listDevices = <p>Loading</p>
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
                                                                      onChange={this.handleChange.bind(this,"device_permissions")}/></div>
                    <div className="col-md-2 col-center-label"><Input type="checkbox" aria-label="Control"
                                                                      name={'control_' + device.device_uuid}
                                                                      id={'control_' + device.device_uuid}
                                                                      checked={this.state['control_' + device.device_uuid]}
                                                                      onChange={this.handleChange.bind(this,"device_permissions")}/></div>
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
                                    onDone={this.onImageUpload}/>
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
                                <div className="row"><h3>My Devices </h3></div>
                                {listDevices}
                                <div className="row"><h3>Sharing </h3></div>
                                <div className="row profile-card-row"><Button color="link"
                                                                              onClick={this.toggle_access_code_modal}>Create
                                    Access Code</Button></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">

                    </div>
                </div>
                <Modal isOpen={this.state.access_code_modal} toggle={this.toggle_access_code_modal}
                       className={this.props.className}>
                    <ModalHeader toggle={this.toggle_access_code_modal}><i>Select which devices to
                        share</i></ModalHeader>
                    <ModalBody>
                        <div>

                            <div className="row profile-card-row">
                                <div className="col-md-8"></div>
                                <div className="col-md-2">View</div>
                                <div className="col-md-2">Control</div>
                            </div>
                            <Form>
                                <FormGroup>
                                    {listShareDevices}
                                </FormGroup>
                                {/*<FormGroup>*/}
                                    {/*<Input type="text" name="access_code" id="access_code"*/}
                                           {/*placeholder="6-digit Access Code" value={this.state.access_code}*/}
                                           {/*onChange={this.handleChange.bind(this,"")}/>*/}
                                {/*</FormGroup>*/}
                            </Form>

                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.get_device_code}>Get Access Code</Button>
                        <Button color="secondary" onClick={this.toggle_access_code_modal}>Close</Button>
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

            </div>
        )
    }
}

export default withCookies(profile);
