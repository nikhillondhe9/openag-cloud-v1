import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import './home.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";

class Home extends Component {
    constructor(props) {
        super(props);
        this.username = this.props.match.params.username
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            modal: false,
            deviceNumber: '',
            deviceName: '',
            deviceDescription: '',
            user_devices:[]
        };

        this.toggle = this.toggle.bind(this);
        this.registerDevice = this.registerDevice.bind(this);
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.getUserDevices = this.getUserDevices.bind(this);
    }

    componentWillMount()
    {
        if (this.props.cookies.get('user_token') === '' || this.props.cookies.get('user_token') === undefined) {
            window.location.href="/login"
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
        return fetch('http://127.0.0.1:5000/api/get_user_devices/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'username': this.username
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.setState({user_devices:responseJson["results"]})
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    registerDevice() {
        console.log(JSON.stringify({
            'username': this.username,
            'deviceNumber': this.state.deviceNumber,
            'deviceName': this.state.deviceName,
            'deviceDescription': this.state.deviceDescription
        }))
        return fetch('http://127.0.0.1:5000/api/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'username': this.username,
                'deviceNumber': this.state.deviceNumber,
                'deviceName': this.state.deviceName,
                'deviceDescription': this.state.deviceDescription
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

            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {
        let listDevices = <p>Loading</p>
        if(this.state.user_devices.length > 0 )
        {
            listDevices = this.state.user_devices.map((device)=>{
            return <div className="col-md-3" key={device.device_id}> <div  className="card">
                            <div className="card-body">
                                <h5 className="card-title">{device.device_id}</h5>
                                <h6 className="card-subtitle mb-2 text-muted">{device.device_name}</h6>
                                <p className="card-text">{device.device_notes}</p>
                                <p className="card-text">This device is currently running the recipe id : {device.device_notes}</p>
                                <p className="card-text"> Device Status: OK</p>
                                <a href="#" className="card-link">Device Homepage</a>
                            </div>
            </div> </div>
        });

        }

        return (
            <Router>
                <div className="home-container">
                    <div className="name-row">
                        <div className="col-md-10 cell-col">
                            <h2>Your current food computers </h2>
                        </div>

                        <div className="col-md-2 cell-col" onClick={this.toggle}>
                            <a href="#" className="fancy-button bg-gradient1"><span><i
                                className="fa fa-ticket"></i>Add Device</span></a>
                        </div>

                    </div>
                    <div className="row card-row">
                        {listDevices}
                    </div>
                    <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
                        <ModalHeader toggle={this.toggle}>New Device Registration</ModalHeader>
                        <ModalBody>
                            <Form>
                                <FormGroup>
                                    <Label for="deviceName">Device name :</Label>
                                    <Input type="text" name="deviceName" id="deviceName"
                                           placeholder="E.g Caleb's FC" value={this.state.deviceName}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="deviceNumber">Device Number :</Label>
                                    <Input type="text" name="deviceNumber" id="deviceNumber"
                                           placeholder="Six digit code" value={this.state.deviceNumber}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="deviceDescription">Device Notes :</Label>
                                    <Input type="text" name="deviceDescription" id="deviceDescription"
                                           placeholder="(Optional)" value={this.state.deviceDescription}
                                           onChange={this.handleChange}/>
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
