import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../scss/horticulture_success.scss';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import {ImageUploader} from './components/image_uploader';
import {CreateAccessCodeModal} from './components/create_access_code_modal.js';
import withered from '../images/withered.png';
import med_withered from '../images/med_withered.png';
import normal from '../images/normal.png';
import curl1 from '../images/curl1.JPG';

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
                        <div className="col-md-6">
                            Leaf Discoloration
                        </div>
                        <div className="col-md-6">
                            <div className="row padded-row">
                                Pick all the colors you see on the leaf
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither'
                                                                          src="https://blog.extension.uconn.edu/wp-content/uploads/sites/419/2014/06/basil-downy-mildew2-Ja-1024x682.jpg"
                                                                                                     width="100" height="100"/></div><div className="row">Green</div></div>
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither'
                                                                          src="https://www.straitstimes.com/sites/default/files/basillemon.jpg"
                                                                          width="100" height="100"/></div><div className="row">Yellow Green</div></div>
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither'
                                                                          src="https://img.hunkercdn.com/640/photos.demandstudios.com/227/50/fotolia_6694088_XS.jpg"
                                                                          width="100" height="100"/></div><div className="row"></div></div>
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither'
                                                                          src="https://4.bp.blogspot.com/-yir1nM7pAHw/UeYKBvTO3gI/AAAAAAAADmA/pAmqTlt0SQ4/s1600/IMG_9297.JPG"
                                                                          width="100" height="100"/></div><div className="row"></div></div>
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither'
                                                                          src="https://cdn.gardenista.com/wp-content/uploads/2015/04/img/sub/uimg/07-2012/700_purple-basil-dark-opal.jpg"
                                                                                               width="100" height="100"/></div><div className="row">Purple</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-6">
                            Leaf Curling
                        </div>
                        <div className="col-md-6">
                            <div className="row padded-row">
                                Pick the closest structure of your leaves
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither' height="100"
                                                                          src={curl1}/></div><div className="row">Healthy</div></div>
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither' height="100"
                                                                          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyAvP0KV2UBbW5q4L4HIMBaLUcNg76FmYwoc9Sl8B1k1lvEd4o"/></div><div className="row">Some withered</div>
                                </div>
                                <div className="col-md-2 padded-col"><div className="row"><img className='leaf-wither' height="100"
                                                                          src="http://homewarehuntress.com/wp-content/uploads/2014/04/wilting-basil-plant-1024x768.jpg"/></div><div className="row">Withered</div>
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
