import React, {Component} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import './edit_recipe.css';
import {Form, FormGroup, Input} from 'reactstrap';

class EditRecipe extends Component {
    constructor(props) {
        super(props);
        this.state = {
            temp_humidity_sht25: '',
            co2_t6713: '',
            cool_white: '',
            blue: '',
            green: '',
            warm_white: '',
            red: '',
            far_red: '',
            lights_on: ''

        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClear = this.handleClear.bind(this);
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
        event.preventDefault();
    }


    handleSubmit(event) {

        console.log('A recipe edit form was submitted');
        console.log(this.state)
        event.preventDefault();
    }

    handleClear(event) {

        this.setState({
            temp_humidity_sht25: '',
            co2_t6713: '',
            cool_white: '',
            blue: '',
            green: '',
            warm_white: '',
            red: '',
            far_red: '',
            lights_on: ''

        });
        event.preventDefault();
    }

    render() {
        return (
            <Router>
                <div className="recipe-container">
                    <Form className="recipe-form">
                        <div className="row card-row">
                            <FormGroup className="col-md-3 paddedcol">
                                <div className="card temp-card">
                                    <div className="card-body">
                                        <h5 className="card-title">Temperate and Humidity</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">Type: Sensor</h6>
                                        <div>Publish values of this sensor every
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="smallInput"><Input type="text"
                                                                                       name="temp_humidity_sht25"
                                                                                       id="temp_humidity_sht25"
                                                                                       placeholder=""
                                                                                       value={this.state.temp_humidity_sht25}
                                                                                       onChange={this.handleChange}/>

                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <select className="form-control">
                                                        <option value="seconds">Seconds</option>
                                                        <option value="minutes">Minutes</option>
                                                        <option value="hours">Hours</option>
                                                    </select>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </FormGroup>
                            <FormGroup className="col-md-3 paddedcol">
                                <div className="card temp-card">
                                    <div className="card-body">
                                        <h5 className="card-title">C02 sensor</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">Type: Sensor</h6>
                                        <div>Publish values of this sensor every
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="smallInput"><Input type="text"
                                                                                       name="co2_t6713"
                                                                                       id="co2_t6713"
                                                                                       placeholder=""
                                                                                       value={this.state.co2_t6713}
                                                                                       onChange={this.handleChange}/>

                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <select className="form-control">
                                                        <option value="seconds">Seconds</option>
                                                        <option value="minutes">Minutes</option>
                                                        <option value="hours">Hours</option>
                                                    </select>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </FormGroup>
                        </div>

                        <div className="row card-row">

                            <FormGroup className="col-md-12 paddedcol">
                                <div className="card led-card">
                                    <div className="card-body">
                                        <h5 className="card-title">6 channel (spectrum) LED panel</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">Type: Actuator</h6>
                                        <h6 className="card-title">Step 1: Lights ON </h6>

                                        <div className="row small-input-row">Publish values of this sensor every
                                            <div className="col-md-6">
                                                <div className="smallInput"><Input type="text"
                                                                                   name="co2_t6713"
                                                                                   id="co2_t6713"
                                                                                   placeholder=""
                                                                                   value={this.state.co2_t6713}
                                                                                   onChange={this.handleChange}/>

                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <select className="form-control smallInput">
                                                    <option value="seconds">Seconds</option>
                                                    <option value="minutes">Minutes</option>
                                                    <option value="hours">Hours</option>
                                                </select>
                                            </div>
                                        </div>


                                        <div className="row padded-row">
                                            <div className="col-md-6"><h6>Far Red</h6></div>
                                            <div className="col-md-6"><Input type="text" name="far_red" id="far_red"
                                                                             placeholder="" value={this.state.far_red}
                                                                             onChange={this.handleChange}/></div>
                                        </div>

                                        <div className="row padded-row">
                                            <div className="col-md-6"><h6>Red</h6></div>
                                            <div className="col-md-6"><Input type="text" name="red" id="red"
                                                                             placeholder="" value={this.state.red}
                                                                             onChange={this.handleChange}/></div>
                                        </div>

                                        <div className="row padded-row">
                                            <div className="col-md-6"><h6>Warm White</h6></div>
                                            <div className="col-md-6"><Input type="text" name="warm_white"
                                                                             id="warm_white"
                                                                             placeholder=""
                                                                             value={this.state.warm_white}
                                                                             onChange={this.handleChange}/></div>
                                        </div>

                                        <div className="row padded-row">
                                            <div className="col-md-6"><h6>Green</h6></div>
                                            <div className="col-md-6"><Input type="text" name="green" id="green"
                                                                             placeholder="" value={this.state.green}
                                                                             onChange={this.handleChange}/></div>
                                        </div>

                                        <div className="row padded-row">
                                            <div className="col-md-6"><h6>Cool white</h6></div>
                                            <div className="col-md-6"><Input type="text" name="cool_white"
                                                                             id="cool_white" placeholder=""
                                                                             value={this.state.cool_white}
                                                                             onChange={this.handleChange}/></div>
                                        </div>

                                        <div className="row padded-row">
                                            <div className="col-md-6"><h6>Blue</h6></div>
                                            <div className="col-md-6"><Input type="text" name="blue" id="blue"
                                                                             placeholder="" value={this.state.blue}
                                                                             onChange={this.handleChange}/></div>
                                        </div>


                                        <h6 className="card-title">Step 2: Lights OFF </h6>

                                        <div className="row small-input-row">Turn the lights of for
                                            <div className="col-md-6">
                                                <div className="smallInput"><Input type="text"
                                                                                   name="co2_t6713"
                                                                                   id="co2_t6713"
                                                                                   placeholder=""
                                                                                   value={this.state.co2_t6713}
                                                                                   onChange={this.handleChange}/>

                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <select className="form-control smallInput">
                                                    <option value="seconds">Seconds</option>
                                                    <option value="minutes">Minutes</option>
                                                    <option value="hours">Hours</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </FormGroup>

                        </div>
                    </Form>
                    <div className="col-md-2 cell-col" onClick={this.handleSubmit}>
                        <a href="#" className="fancy-button bg-gradient1"><span><i
                            className="fa fa-ticket"></i>Submit Recipe</span></a>
                    </div>
                    <div className="col-md-2 cell-col" onClick={this.handleClear}>
                        <a href="#" className="fancy-button bg-gradient1"><span><i
                            className="fa fa-ticket"></i>Reset</span></a>
                    </div>

                </div>

            </Router>

        );
    }
}

export default EditRecipe;
