import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../scss/horticulture_success.scss';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import darkgreen from "../images/dark_green.png";
import lushgreen from "../images/lush_green.png";
import yellow from "../images/yellow.png";
import yellowgreen from "../images/yellow_green.png";
import healthy from "../images/healthy.png";
import withered from "../images/withered.png";
import partially_withered from "../images/partially_withered.png";

import * as api from './utils/api';
import {CirclePicker} from 'react-color';

class HarvestPlant extends Component {
    constructor(props) {
        super(props);
        let device_uuid = this.props.match.params.device_uuid;
        this.state = {
            successfully_submitted: false,
            bgColor:["rgba(149, 38, 106,0.8)","rgba(149, 38, 106,0.8)","rgba(149, 38, 106,0.8)","rgba(149, 38, 106,0.8)","rgba(149, 38, 106,0.8)","rgba(149, 38, 106,0.8)"]
        };
        this.submitRecipe = this.submitRecipe.bind(this);
        this.sensorOnChange = this.sensorOnChange.bind(this);
        this.onFlavorClick = this.onFlavorClick.bind(this);
    }
    onFlavorClick(index,e)
    {
        console.log("here",index)
        let bgcolors = this.state.bgColor
        bgcolors[index] = "#358A49";
        this.setState({bgColor:bgcolors})
    }
    componentDidMount() {

    }

    submitRecipe() {
        this.setState({successfully_submitted: true})
    }

    sensorOnChange(e) {
        this.setState({[e.target.name]: e.target.value})
    }

    render() {
        let shaded_browns = ["#FFF8DC", "#CD853F", "#795548"]
        return (

            <div className="horticulture-container">
                {this.state.successfully_submitted ? <div className="row measurements-row">
                    <div className="row">
                        <div className="row">
                            <a href="/device_homepage" className="goback-text"> Back to device homepage</a>
                        </div>
                        <div className="row">

                            <h3> Thank you! Your measurements have been submitted </h3>
                        </div>
                    </div>

                </div> : <div>
                    <div className="row measurements-row">
                        <div className="col-md-12">
                            <div className="row">
                                <a href="/device_homepage" className="goback-text"> Back to device homepage</a>
                            </div>
                            <div className="row">
                                <h3> Horticulture Measurements </h3>
                            </div>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-6">
                            Plant Height
                        </div>
                        <div className="col-md-6">
                            <Input onChange={this.sensorOnChange} name="plant_height" placeholder="Height in (cm)"/>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-6">
                            Plant Weight (with roots)
                        </div>
                        <div className="col-md-6">
                            <Input onChange={this.sensorOnChange} name="plant_weight_roots" placeholder="Weight in (grams)"/>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-6">
                            Plant Weight (without roots)
                        </div>
                        <div className="col-md-6">
                            <Input onChange={this.sensorOnChange} name="plant_weight_without_roots" placeholder="Weight in (grams)"/>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-6">
                            Leaf Count
                        </div>
                        <div className="col-md-6">
                            <Input onChange={this.sensorOnChange} name="leaf_count"/>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Leaf Discoloration
                        </div>
                        <div className="col-md-9">
                            <div className="row padded-row">
                                Pick all the colors you see on the leaf
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className='leaf-wither'
                                             width="100" height="100" src={yellow}/></div>
                                    <div className="row">Yellow</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className='leaf-wither'
                                             width="100" height="100" src={yellowgreen}/></div>
                                    <div className="row">Yellow Green</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className='leaf-wither'
                                             width="100" height="100" src={lushgreen}/></div>
                                    <div className="row">Lush Green</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className='leaf-wither'
                                             width="100" height="100" src={darkgreen}/></div>
                                    <div className="row">Dark Green</div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Leaf Curling
                        </div>
                        <div className="col-md-9">
                            <div className="row padded-row">
                                Pick the closest structure of your leaves
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2">
                                    <div className="row"><img className='leaf-wither' height="100"
                                                              src={healthy}/></div>
                                    <div className="row">Healthy</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row"><img className='leaf-wither' height="100"
                                                              src={partially_withered}/>
                                    </div>
                                    <div className="row">Partial withered</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row"><img className='leaf-wither' height="100"
                                                              src={withered}/>
                                    </div>
                                    <div className="row">Withered</div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="row measurements-row">

                        <div className="col-md-6">
                            Roots
                        </div>
                        <div className="col-md-6">
                            <div className="row padded-row">
                                Color of your roots
                            </div>
                            <div className="row padded-row">
                                <CirclePicker colors={shaded_browns}/>
                            </div>
                            <div className="row padded-row">
                                Smell
                            </div>
                            <div className="row padded-row">
                                <Button className="green-button">Normal</Button>
                                <Button className="red-button">Rotten</Button>
                            </div>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-6">
                            Flavor
                        </div>
                        <div className="col-md-6">
                             <div className="wheel outer-wheel">

                                <ul id="flavours">
                                    <li data-flavour="cereal" style={{backgroundColor:this.state.bgColor[0]}} onClick={this.onFlavorClick.bind(this,0)}><span>Spicy</span></li>
                                    <li data-flavour="fruity" style={{backgroundColor:this.state.bgColor[1]}} onClick={this.onFlavorClick.bind(this,1)}><span>Fruity</span></li>
                                    <li data-flavour="floral" style={{backgroundColor:this.state.bgColor[2]}} onClick={this.onFlavorClick.bind(this,2)}><span>Floral</span></li>
                                    <li data-flavour="feinty" style={{backgroundColor:this.state.bgColor[3]}} onClick={this.onFlavorClick.bind(this,3)}><span>Sugar</span></li>
                                    <li data-flavour="sulphury" style={{backgroundColor:this.state.bgColor[4]}} onClick={this.onFlavorClick.bind(this,4)}><span>Earthy</span></li>
                                    <li data-flavour="woody" style={{backgroundColor:this.state.bgColor[5]}} onClick={this.onFlavorClick.bind(this,5)}><span>Woody</span></li>
                                </ul>
                            </div>

                        </div>
                    </div>

                    <div className="row measurements-row">
                        <div className="col-md-8">
                        </div>
                        <div className="col-md-4 color-button">
                            <Button className="apply-button btn btn-secondary" onClick={this.submitRecipe}>Submit
                                Measurements</Button>
                        </div>
                    </div>
                </div>}

            </div>
        )
    }
}

export default withCookies(HarvestPlant);
