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
import brown_root from "../images/brown.png";
import brownish_root from "../images/brownish_root.png";
import white_root from "../images/white_root.png";
import classNames from 'classnames';

class HorticultureSuccess extends Component {
    constructor(props) {
        super(props);
        let device_uuid = this.props.match.params.device_uuid;
        this.state = {
            successfully_submitted: false,
            plant_height: "",
            leaf_count: "",
            leaf_colors: [],
            leaf_withering: [],
            flavors: [],
            root_colors: [],
            device_uuid: device_uuid,
            submission_name: "",
            horticulture_notes: ""
        };
    }


    componentDidMount() {

    }

    submitRecipe = () => {
        fetch(process.env.REACT_APP_FLASK_URL + '/api/daily_horticulture_measurements/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                device_uuid: this.state.device_uuid,
                plant_height: this.state.plant_height,
                leaf_count: this.state.leaf_count,
                leaf_colors: this.state.leaf_colors,
                leaf_withering: this.state.leaf_withering,
                flavors: this.state.flavors,
                root_colors: this.state.root_colors,
                horticulture_notes: this.state.horticulture_notes,
                submission_name: this.state.submission_name
            })
        })
            .then(response => response.json())
            .then(response => {
                this.setState({successfully_submitted: true})
            });

    }

    sensorOnChange = (e) => {
        this.setState({[e.target.name]: e.target.value})
    }
    addToFlavors = (flavor, e) => {
        if (this.selectedBorder(flavor, "flavors")) {
            let array_elems = []
            for (let arr_elem of this.state["flavors"]) {
                if (arr_elem !== flavor) {
                    array_elems.push(arr_elem)
                }
            }
            this.setState({flavors: array_elems});
        }
        else {
            let state_now = this.state.flavors
            let flavors_arr = state_now.concat(flavor)
            this.setState({flavors: flavors_arr});
        }
    }
    handleInputChange = (event) => {
        this.setState({[event.target.name]: event.target.value});
    }
    selectRootColor = (root_color, e) => {
        if (this.selectedBorder(root_color, "root_colors")) {
            let array_elems = []
            for (let arr_elem of this.state["root_colors"]) {
                if (arr_elem !== root_color) {
                    array_elems.push(arr_elem)
                }
            }
            this.setState({root_colors: array_elems});
        }
        else {
            let state_now = this.state.root_colors
            let root_colors_arr = state_now.concat(root_color)
            this.setState({root_colors: root_colors_arr});
        }
    }
    selectLeafColor = (leaf_color, e) => {
        if (this.selectedBorder(leaf_color, "leaf_colors")) {
            let array_elems = []
            for (let arr_elem of this.state["leaf_colors"]) {
                if (arr_elem !== leaf_color) {
                    array_elems.push(arr_elem)
                }
            }
            this.setState({leaf_colors: array_elems});
        }
        else {
            let state_now = this.state.leaf_colors
            let leaf_colors_arr = state_now.concat(leaf_color)
            this.setState({leaf_colors: leaf_colors_arr});
        }

    }
    selectLeafWither = (leaf_wither, e) => {
        //If the leaf wither is in the withers list already, remove it on second click
        if (this.selectedBorder(leaf_wither, "leaf_withering")) {
            let array_elems = []
            for (let arr_elem of this.state["leaf_withering"]) {
                if (arr_elem !== leaf_wither) {
                    array_elems.push(arr_elem)
                }
            }
            this.setState({leaf_withering: array_elems});
        }
        else {
            let state_now = this.state.leaf_withering
            let leaf_withering_arr = state_now.concat(leaf_wither)
            this.setState({leaf_withering: leaf_withering_arr});
        }
    }
    selectedBorder = (elem, array_to_search, e) => {

        for (let arr_elem of this.state[array_to_search]) {
            if (arr_elem === elem) {
                return true
            }
        }

        return false
    }

    render() {
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
                        <div className="col-md-3">
                            Plant Height
                        </div>
                        <div className="col-md-9">
                            <Input onChange={this.sensorOnChange} name="plant_height" placeholder="Height in (cm)"/>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Leaf Count
                        </div>
                        <div className="col-md-9">
                            <Input onChange={this.sensorOnChange} name="leaf_count"/>
                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Leaf Discoloration
                        </div>
                        <div className="col-md-9">
                            <div className="row">
                                <div className="col-md-12">

                                    <i> Pick all the colors you see on the leaf </i>
                                </div>
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className={classNames({
                                            'leaf-wither': true,
                                            'leaf-wither-with-border': this.selectedBorder("YELLOW", "leaf_colors")
                                        })}
                                             width="100" height="100" src={yellow}
                                             onClick={this.selectLeafColor.bind(this, "YELLOW")}/></div>
                                    <div className="row">Yellow</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className={classNames({
                                            'leaf-wither': true,
                                            'leaf-wither-with-border': this.selectedBorder("YELLOWGREEN", "leaf_colors")
                                        })}
                                             width="100" height="100" src={yellowgreen}
                                             onClick={this.selectLeafColor.bind(this, "YELLOWGREEN")}/></div>
                                    <div className="row">Yellow Green</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className={classNames({
                                            'leaf-wither': true,
                                            'leaf-wither-with-border': this.selectedBorder("LUSHGREEN", "leaf_colors")
                                        })}
                                             width="100" height="100" src={lushgreen}
                                             onClick={this.selectLeafColor.bind(this, "LUSHGREEN")}/></div>
                                    <div className="row">Lush Green</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row">
                                        <img className={classNames({
                                            'leaf-wither': true,
                                            'leaf-wither-with-border': this.selectedBorder("DARKGREEN", "leaf_colors")
                                        })}
                                             width="100" height="100" src={darkgreen}
                                             onClick={this.selectLeafColor.bind(this, "DARKGREEN")}/></div>
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
                            <div className="row">
                                <div className="col-md-12">

                                    <i> Pick the closest structure of your leaves </i>
                                </div>
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2">
                                    <div className="row"><img className={classNames({
                                        'leaf-wither': true,
                                        'leaf-wither-with-border': this.selectedBorder("HEALTHY", "leaf_withering")
                                    })} height="100"
                                                              src={healthy}
                                                              onClick={this.selectLeafWither.bind(this, "HEALTHY")}/>
                                    </div>
                                    <div className="row">Healthy</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row"><img className={classNames({
                                        'leaf-wither': true,
                                        'leaf-wither-with-border': this.selectedBorder("PARTIALLYWITHERED", "leaf_withering")
                                    })} height="100"
                                                              src={partially_withered}
                                                              onClick={this.selectLeafWither.bind(this, "PARTIALLYWITHERED")}/>
                                    </div>
                                    <div className="row">Partial withered</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row"><img className={classNames({
                                        'leaf-wither': true,
                                        'leaf-wither-with-border': this.selectedBorder("WITHERED", "leaf_withering")
                                    })} height="100"
                                                              src={withered}
                                                              onClick={this.selectLeafWither.bind(this, "WITHERED")}/>
                                    </div>
                                    <div className="row">Withered</div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Roots
                        </div>
                        <div className="col-md-9">
                            <div className="row">
                                <div className="col-md-12">

                                    <i> Color of your roots </i>
                                </div>
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2">
                                    <div className="row"><img className={classNames({
                                        'leaf-wither': true,
                                        'leaf-wither-with-border': this.selectedBorder("WHITE", "root_colors")
                                    })} height="100"
                                                              width="100" src={white_root}
                                                              onClick={this.selectRootColor.bind(this, "WHITE")}/></div>
                                    <div className="row">White</div>
                                </div>
                                l
                                <div className="col-md-2">
                                    <div className="row"><img className={classNames({
                                        'leaf-wither': true,
                                        'leaf-wither-with-border': this.selectedBorder("BROWNISH", "root_colors")
                                    })} height="100"
                                                              width="100" src={brownish_root}
                                                              onClick={this.selectRootColor.bind(this, "BROWNISH")}/>
                                    </div>
                                    <div className="row">Brownish</div>
                                </div>
                                <div className="col-md-2">
                                    <div className="row"><img className={classNames({
                                        'leaf-wither': true,
                                        'leaf-wither-with-border': this.selectedBorder("BROWN", "root_colors")
                                    })} height="100"
                                                              width="100" src={brown_root}
                                                              onClick={this.selectRootColor.bind(this, "BROWN")}/>
                                    </div>
                                    <div className="row">Brown</div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Flavor
                        </div>
                        <div className="col-md-9">
                            <div className="row">
                                <div className="col-md-12">

                                    <i> Pick all the flavors you taste </i>
                                </div>
                            </div>
                            <div className="row padded-row">
                                <div className="col-md-2">
                                    <label>
                                        <Input type="checkbox" aria-label="Woody"
                                               onClick={this.addToFlavors.bind(this, "Woody")}/>
                                        Woody
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label>
                                        <Input type="checkbox" aria-label="Fruity"
                                               onClick={this.addToFlavors.bind(this, "Fruity")}/>
                                        Fruity
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label>
                                        <Input type="checkbox" aria-label="Citrus"
                                               onClick={this.addToFlavors.bind(this, "Citrus")}/>
                                        Citrus
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label>
                                        <Input type="checkbox" aria-label="Minty"
                                               onClick={this.addToFlavors.bind(this, "Minty")}/>
                                        Minty
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label>
                                        <Input type="checkbox" aria-label="Earthy"
                                               onClick={this.addToFlavors.bind(this, "Earthy")}/>
                                        Earthy</label>
                                </div>
                                <div className="col-md-2">
                                    <label>
                                        <Input type="checkbox" aria-label="Floral"
                                               onClick={this.addToFlavors.bind(this, "Floral")}/>
                                        Floral
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Horticulture Notes
                        </div>
                        <div className="col-md-9">

                            <div className="row padded-row">
                                <div className="col-md-12">

                                    <Input type="textarea" name="horticulture_notes"
                                           placeholder={"Any additional notes ?"} onChange={this.handleInputChange}/>

                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="row measurements-row">
                        <div className="col-md-3">
                            Submitted by
                        </div>
                        <div className="col-md-9">

                            <div className="row padded-row">
                                <div className="col-md-12">

                                    <Input type="text" name="submission_name"
                                           placeholder={"Enter the name of the person logging measurements"}
                                           onChange={this.handleInputChange}/>

                                </div>
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

export default withCookies(HorticultureSuccess);
