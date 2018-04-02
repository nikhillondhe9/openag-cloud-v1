import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import './home.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter,Form, FormGroup,Label,Input} from 'reactstrap';

class Home extends Component {
    constructor(props) {


        super(props);
        this.username = this.props.match.params.username
        this.state = {
            modal: false,
            deviceNumber:'',
            deviceName:'',
            deviceDescription:''
        };

        this.getUserDevices();
        this.toggle = this.toggle.bind(this);
        this.registerDevice = this.registerDevice.bind(this);
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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

    getUserDevices()
    {
        console.log( JSON.stringify({
                'username': this.username
            }))
        return fetch('https://flaskapi-dot-openag-v1.appspot.com/api/get_user_devices/', {
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
                if (responseJson["response_code"]== 200){

                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    registerDevice()
    {
        console.log( JSON.stringify({
                'username': this.username,
                'deviceNumber': this.state.deviceNumber,
                'deviceName': this.state.deviceName,
                'deviceDescription': this.state.deviceDescription
            }))
        return fetch('https://flaskapi-dot-openag-v1.appspot.com/api/register/', {
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
                if (responseJson["response_code"]== 200){

                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {

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

                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Card title</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
                                    <p className="card-text">Some quick example text to build on the card title and make
                                        up the
                                        bulk of the card's content.</p>
                                    <a href="#" className="card-link">Go to device</a>

                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Card title</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
                                    <p className="card-text">Some quick example text to build on the card title and make
                                        up the
                                        bulk of the card's content.</p>
                                    <a href="#" className="card-link">Go to device</a>

                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Card title</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
                                    <p className="card-text">Some quick example text to build on the card title and make
                                        up the
                                        bulk of the card's content.</p>
                                    <a href="#" className="card-link">Go to device</a>

                                </div>
                            </div>
                        </div>
                    </div>
                    <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
                        <ModalHeader toggle={this.toggle}>New Device Registration</ModalHeader>
                        <ModalBody>
                            <Form>
                                <FormGroup>
                                    <Label for="deviceName">Device name :</Label>
                                    <Input type="text" name="deviceName" id="deviceName"
                                           placeholder="E.g rob's FC" value={this.state.deviceName}
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

export default Home;
