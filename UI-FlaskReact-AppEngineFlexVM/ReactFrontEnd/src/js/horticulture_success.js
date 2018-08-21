import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../scss/horticulture_success.scss';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import {ImageUploader} from './components/image_uploader';
import {CreateAccessCodeModal} from './components/create_access_code_modal.js';
import withered from'../images/withered.png';
import med_withered from'../images/med_withered.png';
import normal from'../images/normal.png';


import * as api from './utils/api';
import {CirclePicker} from 'react-color';
class HorticultureSuccess extends Component {
    constructor(props) {
        super(props);
        let device_uuid = this.props.match.params.device_uuid;
        this.state = {
            successfully_submitted:false
        };
        this.submitRecipe = this.submitRecipe.bind(this);
        this.sensorOnChange = this.sensorOnChange.bind(this);
    }

    componentDidMount() {

    }
    submitRecipe()
    {
        this.setState({successfully_submitted:true})
    }
    sensorOnChange(e) {
        this.setState({[e.target.name]: e.target.value})
    }
    render() {
        let green_color = ["#8bc34a"]
        let brown_color = ["#795548"]
        let yellow_color = ["#ffeb3b"]
        let shaded_browns= ["#FFF8DC","#CD853F","#795548"]
        return (

            <div className="horticulture-container">
                {this.state.successfully_submitted ?  <div className="row measurements-row">
                    <div className="col-md-12">
                        <h3> Thank you! Your climate recipe has been submitted for approval </h3>
                    </div>

                </div>: <div>
                <div className="row measurements-row">
                    <div className="col-md-12">
                        <h3> Congratulations! Please answer the following questions to submit your climate recipe </h3>
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
                        Plant Weight
                    </div>
                    <div className="col-md-6">
                        <div className="row padded-row">
                            Weight with roots (in grams)
                        </div>
                        <div className="row padded-row">
                        <Input onChange={this.sensorOnChange} name="plant_weight_roots" placeholder=""/>
                         </div>
                        <div className="row padded-row">
                            Weight without roots (in grams)
                        </div>
                        <div className="row padded-row">
                        <Input onChange={this.sensorOnChange} name="plant_weight_wo_roots" placeholder=""/>
                         </div>
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
                            <div className="col-md-2"> <CirclePicker colors={green_color}/></div>
                            <div className="col-md-2"> <CirclePicker colors={brown_color}/></div>
                            <div className="col-md-2"> <CirclePicker colors={yellow_color}/></div>
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
                            <div className="col-md-2"> <img className='leaf-wither' height="100" src={normal} /></div>
                            <div className="col-md-2"> <img className='leaf-wither' height="100" src={med_withered} /></div>
                            <div className="col-md-2"> <img className='leaf-wither' height="100" src={withered} /></div>
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
                    <Input onChange={this.sensorOnChange} name="flavor" placeholder="Describe the flavor"/>
                    </div>
                </div>
                <div className="row measurements-row">
                    <div className="col-md-6">
                        Nutrient Density
                    </div>
                    <div className="col-md-6">
                    <Input onChange={this.sensorOnChange} name="nutrient_density" placeholder="Nutrient Density"/>
                    </div>
                </div>
                 <div className="row measurements-row">
                     <div className="col-md-12">
                        <Button onClick={this.submitRecipe}>Submit Recipe</Button>
                     </div>
                 </div>
                </div>}

            </div>
        )
    }
}

export default withCookies(HorticultureSuccess);
