import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Link, withRouter} from "react-router-dom";
import '../css/home.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";
import image1 from '../1.png';
import image2 from '../2.png';
import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from 'reactstrap';
import placeholder from '../placeholder.png';
import { Timeline } from 'react-twitter-widgets'
class Home extends Component {
    constructor(props) {
        super(props);
        this.user_uuid = this.props.location.pathname.replace("/home/","").replace("#","")
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            modal: false,
            device_name: '',
            device_reg_no: '',
            device_notes: '',
            user_uuid: this.user_uuid,
            device_type: 'PFC_EDU',
            user_devices: [],
            dropdownOpen: false,
            dropDownValue: 'Choose a PFC'
        };

        this.toggle = this.toggle.bind(this);
        this.registerDevice = this.registerDevice.bind(this);
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.getUserDevices = this.getUserDevices.bind(this);
        this.postToTwitter = this.postToTwitter.bind(this);
        this.dropdowntoggle = this.dropdowntoggle.bind(this);
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

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
        event.preventDefault();
    }

    handleSubmit(event) {

        console.log('A register device form was submitted');
        this.registerDevice()
        event.preventDefault();
    }

    toggle() {
        this.setState({
            modal: !this.state.modal
        });
    }

    getUserDevices() {
        return fetch( process.env.REACT_APP_FLASK_URL +'/api/get_user_devices/', {
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
                        this.setState({dropDownValue: name});
                        device_uuid = devs[0].device_uuid;
                        this.setState({selected_device_uuid: device_uuid});
                    }

                    this.setState({user_devices: responseJson["results"]})
                    console.log("Response", responseJson["results"])
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    registerDevice() {
        console.log(JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'device_name': this.state.device_name,
                'device_reg_no': this.state.device_reg_no,
                'device_notes': this.state.device_notes,
                'device_type': this.state.device_type
            }))
        return fetch( process.env.REACT_APP_FLASK_URL + '/api/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'device_name': this.state.device_name,
                'device_reg_no': this.state.device_reg_no,
                'device_notes': this.state.device_notes,
                'device_type': this.state.device_type
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.setState({
                        modal: false
                    });
                }
                this.getUserDevices()
            })
            .catch((error) => {
                console.error(error);
            });
    }
    goToDeviceHomePage(device_uuid)
    {   console.log(device_uuid,"UU")
        if (device_uuid) {
            window.location.href = "/device/" + device_uuid.toString();
        }
    }
    postToTwitter()
        {
            return fetch( process.env.REACT_APP_FLASK_URL + '/api/posttwitter/', {
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

    dropdowntoggle() {
        this.setState(prevState => ({
            dropdownOpen: !prevState.dropdownOpen
        }));
    }
    render() {
        let listDevices = <p>Loading</p>
        if (this.state.user_devices.length > 0) {
            listDevices = this.state.user_devices.map((device) => {
                return <DropdownItem key={device.device_uuid}
                    value={device.device_uuid}
                    onClick={this.changeValue}>{device.device_name} ({device.device_reg_no}) </DropdownItem>
            });

        }

        return (
            <Router>
                <div className="home-container">
                     <div className="row dropdown-row">
                    <div className="col-md-6">
                        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.dropdowntoggle}
                                  className="row dropdow-row">
                            <DropdownToggle caret>
                                {this.state.dropDownValue}

                            </DropdownToggle>
                            <DropdownMenu>
                                {listDevices}
                                 <DropdownItem value="add_device" onClick={this.changeValue}> Add new device </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                    <div className="col-md-6">
                        <Button className="postbutton" onClick={this.postToTwitter}>Post status to twitter</Button>
                    </div>
                </div>



                    <div className="row">
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
                         <div className="col-md-2">

                        </div>
                        {/*<a className="twitter-timeline" href="https://twitter.com/MITOpenAg?ref_src=twsrc%5Etfw">Tweets by MITOpenAg</a> <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>*/}
                         <div className="col-md-6">
                             <img src={placeholder} className="timelapse-img"></img>
                        </div>
                    </div>

                    <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
                        <ModalHeader toggle={this.toggle}>New Device Registration</ModalHeader>
                        <ModalBody>
                            <Form>
                                <FormGroup>
                                    <Label for="device_name">Device name :</Label>
                                    <Input type="text" name="device_name" id="device_name"
                                           placeholder="E.g Caleb's FC" value={this.state.device_name}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="device_reg_no">Device Number :</Label>
                                    <Input type="text" name="device_reg_no" id="device_reg_no"
                                           placeholder="Six digit code" value={this.state.device_reg_no}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="device_notes">Device Notes :</Label>
                                    <Input type="text" name="device_notes" id="device_notes"
                                           placeholder="(Optional)" value={this.state.device_notes}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="device_type">Device Type :</Label>
                                    <select className="form-control smallInput" name="device_type" id="device_type" onChange={this.handleChange}
                                            value={this.state.device_type}>
                                        <option value="PFC_EDU">Personal Food Computer+EDU</option>
                                        <option value="Food_Server">Food Server</option>
                                    </select>
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.handleSubmit}>Register Device</Button>{' '}
                            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </Router>



        );
    }
}

export default withCookies(Home);
