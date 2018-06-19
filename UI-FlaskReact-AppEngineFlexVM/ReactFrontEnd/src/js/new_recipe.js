import React, {Component} from 'react';
import '../css/new_recipe.css';
import ReactDOM from 'react-dom';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";
import sensor from "../images/sensor.png";
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import {ImageUploader} from './components/image_uploader';
import * as api from "./utils/api";

const showSecond = true;
const str = showSecond ? 'HH:mm:ss' : 'HH:mm';
const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;
const handle = (props) => {
    const {value, dragging, index, ...restProps} = props;
    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={value}
            visible={dragging}
            placement="top"
            key={index}
        >
            <Handle value={value} {...restProps} />
        </Tooltip>
    );
};

class NewRecipe extends Component {

    constructor(props) {
        super(props);
        this.template_recipe_uuid = this.props.location.pathname.replace("/edit_recipe/", "").replace("#", "")
        this.state = {
            plant_type_dropdown_open: false,
            device_type_dropdown_open: false,
            plant_variant_type_dropdown_open: false,
            deviceType_dropDownValue: 'Choose a Device Type',
            plantType_dropDownValue: 'Choose a Plant Type',
            plantyVariantType_dropDownValue: 'Choose the plant variant',
            standard_night: {cool_white: 255, red: 255, blue: 255, green: 255, warm_white: 255, far_red: 255},
            standard_day: {cool_white: 255, red: 255, blue: 255, green: 255, warm_white: 255, far_red: 255},
            peripherals: [],
            changes: {},
            peripheral_details_modal: false,
            sensor_modal_header: "",
            selected_peripheral: {},
            selected_peripheral_fields: <div>S</div>,
            selected_component_fields: <div>Something went wrong</div>,
            T6713: "",
            image_url: "http://via.placeholder.com/200x200"
        }
        this.device_type_dropdowntoggle = this.device_type_dropdowntoggle.bind(this);
        this.plant_type_dropdowntoggle = this.plant_type_dropdowntoggle.bind(this);
        this.plant_variant_type_dropdowntoggle = this.plant_variant_type_dropdowntoggle.bind(this);
        this.get_peripherals = this.get_peripherals.bind(this);
        this.sliderChange = this.sliderChange.bind(this);
        this.togglePeripheralModal = this.togglePeripheralModal.bind(this);
        this.handlePeripheralSubmit = this.handlePeripheralSubmit.bind(this);
        this.onImageUpload = this.onImageUpload.bind(this);
    }

    timeonChange(data_type, value) {
        this.changes[data_type] = value._d;
        this.setState({[data_type]: value._d})
        this.setState({changes: this.changes})
    }

    handlePeripheralSubmit() {

    }

    togglePeripheralModal(peripheral_json, fields, value) {
        this.setState({
            selected_peripheral: peripheral_json
        });
        console.log(peripheral_json)
        if (peripheral_json.type === "T6713") {
            this.setState({
                selected_component_fields: <div className="row input-modal-row">
                    <span>Publish sensor values every</span>
                    <Input value={this.state.T6713} onChange={this.sensorOnChange} id="T6713" name="T6713" type="text"/>
                    <span>Seconds</span>
                </div>
            })
        }
        if (peripheral_json.type === "SHT25") {
            this.setState({
                selected_component_fields: <div className="row input-modal-row">
                    <span>Publish sensor values every</span>
                    <Input value={this.state.T6713} onChange={this.sensorOnChange} id="SHT25" name="SHT25" type="text"/>
                    <span>Seconds</span>
                </div>
            })
        }
        if (peripheral_json.type === "LEDDAC5578") {
            let component_html = <div className="card led-stats-card">
                <div className="card-block">
                    <h4 className="card-title "> Standard Night </h4>
                    <div className="card-text">
                        <div className="graph">
                            <div className="">
                                <div className="row colors-row">
                                    <div className="col-md-6">
                                        <span>Cool White</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider min={0} max={255}
                                                defaultValue={this.state.standard_night.cool_white}
                                                handle={handle}
                                                onChange={this.sliderChange.bind(this, 'standard_night', 'cool_white')}/>
                                    </div>
                                </div>

                                <div className="row colors-row">
                                    <div className="col-md-6">
                                        <span>Warm White</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider min={0} max={255}
                                                defaultValue={this.state.standard_night.warm_white}
                                                handle={handle}
                                                onChange={this.sliderChange.bind(this, 'standard_night', 'warm_white')}/>
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-6">
                                        <span>Blue</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider min={0} max={255}
                                                defaultValue={this.state.standard_night.blue}
                                                handle={handle}
                                                onChange={this.sliderChange.bind(this, 'standard_night', 'blue')}/>
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-6">
                                        <span>Green</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider min={0} max={255}
                                                defaultValue={this.state.standard_night.green}
                                                handle={handle}
                                                onChange={this.sliderChange.bind(this, 'standard_night', 'green')}/>
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-6">
                                        <span>Red</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider min={0} max={255}
                                                defaultValue={this.state.standard_night.red}
                                                handle={handle}
                                                onChange={this.sliderChange.bind(this, 'standard_night', 'red')}/>
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-6">
                                        <span>Far Red</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider min={0} max={255}
                                                defaultValue={this.state.standard_night.far_red}
                                                handle={handle}
                                                onChange={this.sliderChange.bind(this, 'standard_night', 'far_red')}/>
                                    </div>
                                </div>
                            </div>
                            <span className="txt_smaller">
                                                <div className="row time-row">
                                                    <div className="col-md-2">
                                                        From
                                                    </div>
                                                <div className="col-md-4">
                                                    <TimePicker
                                                        style={{width: 150}}
                                                        showSecond={showSecond}
                                                        defaultValue={moment()}
                                                        className="xxx"
                                                        onChange={this.timeonChange.bind(this, "led_off_from")}
                                                    />
                                                </div>
                                                    <div className="col-md-2">
                                                        To
                                                    </div>
                                                <div className="col-md-4"> <TimePicker
                                                    style={{width: 150}}
                                                    showSecond={showSecond}
                                                    defaultValue={moment()}
                                                    className="xxx"
                                                    onChange={this.timeonChange.bind(this, "led_off_to")}
                                                /> </div>
                                            </div>
                                                </span>


                        </div>
                    </div>
                </div>
            </div>
            this.setState({
                selected_component_fields:component_html
            })
        }
        this.setState({
            peripheral_details_modal: !this.state.peripheral_details_modal
        })
    }

    get_peripherals() {
        api.getDevicePeripherals(
            this.props.cookies.get('user_token'),
            'mock-device-uuid'
        ).then(responseJson => {
            console.log(responseJson);
            if (responseJson["response_code"] == 200) {
                let resultJson = responseJson["results"];
                console.log("X", resultJson);
                this.setState({peripherals: resultJson});
            }
        })
        .catch((error) => {
            console.error(error);
        });
    }

    plant_variant_type_dropdowntoggle() {
        this.setState(prevState => ({
            plant_variant_type_dropdown_open: !prevState.plant_variant_type_dropdown_open
        }));
    }

    device_type_dropdowntoggle() {
        this.setState(prevState => ({
            device_type_dropdown_open: !prevState.device_type_dropdown_open
        }));
    }

    plant_type_dropdowntoggle() {
        this.setState(prevState => ({
            plant_type_dropdown_open: !prevState.plant_type_dropdown_open
        }));
    }

    componentDidMount() {
        this.get_peripherals()
    }

    componentWillMount() {

    }

    sliderChange(led_data_type, color_channel, value) {

        let color_json = this.state.standard_day;
        color_json[color_channel] = value;
        this.setState({standard_day: color_json})
        this.changes['standard_day'][color_channel] = value;
        this.setState({["led_off_border"]: "3px solid #883c63"})
        this.setState({changes: this.changes})


    }

    sensorOnChange(e) {
        this.setState({[e.target.name]: e.target.value})
    }

    onImageUpload(response) {
        if (response.response_code == 200) {
            this.setState({image_url: response.url});
        } else {
            console.error('Image upload failed');
        }
    }

    render() {

        let list_components = this.state.peripherals.map((peripheral_json) => {
            return (
                <div className="col-md-2 button-col" key={peripheral_json.name}
                     style={{backgroundColor: peripheral_json.color}}
                     onClick={this.togglePeripheralModal.bind(this, peripheral_json, "")}>
                    <div className="row text-row-top">
                        <h6>{peripheral_json.type}</h6>
                    </div>
                    <div className="row">
                        <img className="centered-image" src={sensor}/>
                    </div>
                    <div className="row text-row-bottom">
                        <h6>{peripheral_json.name}</h6>
                    </div>
                </div>
            )
        });

        return (<div className="recipe-container">
                <div className="details-container">
                    <div className="row input-row">
                        <div className="col-md-4">
                        </div>
                        <div className="col-md-4">
                            <Dropdown isOpen={this.state.device_type_dropdown_open}
                                      toggle={this.device_type_dropdowntoggle}
                                      className="row dropdown-row">
                                <DropdownToggle caret>
                                    {this.state.deviceType_dropDownValue}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem value="add_device"> PFC_EDU </DropdownItem>
                                    <DropdownItem value="add_device"> Food Server </DropdownItem>
                                    <DropdownItem value="add_device"> Other </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>

                    </div>
                    <div className="row input-row">
                        <div className="col-md-4">
                            <img width="200" src={this.state.image_url}/>
                            <ImageUploader
                                url={process.env.REACT_APP_FLASK_URL + "/api/upload_images/"}
                                data={{
                                    type: 'recipe',
                                    user_token: this.props.cookies.get('user_token')
                                }}
                                onDone={this.onImageUpload}
                                className="image-uploader"/>
                        </div>
                        <div className="col-md-8">
                            <Input type="text" className="recipe-details-text" placeholder="Recipe Name"/>
                            <textarea className="recipe-details-text" placeholder="Recipe Description"/>
                            <Dropdown isOpen={this.state.plant_variant_type_dropdown_open}
                                      toggle={this.plant_variant_type_dropdowntoggle}
                                      className="row dropdown-row">
                                <DropdownToggle caret>
                                    {this.state.plantyVariantType_dropDownValue}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem value="add_device"> PFC_EDU </DropdownItem>
                                    <DropdownItem value="add_device"> Food Server </DropdownItem>
                                    <DropdownItem value="add_device"> Other </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            <Dropdown isOpen={this.state.plant_type_dropdown_open}
                                      toggle={this.plant_type_dropdowntoggle}
                                      className="row dropdown-row">
                                <DropdownToggle caret>
                                    {this.state.plantType_dropDownValue}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem value="add_device"> PFC_EDU </DropdownItem>
                                    <DropdownItem value="add_device"> Food Server </DropdownItem>
                                    <DropdownItem value="add_device"> Other </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                    {/*<div className="row input-row">*/}
                    {/*<div className="col-md-4">*/}
                    {/*</div>*/}
                    {/*<div className="col-md-8">*/}
                    {/**/}
                    {/*</div>*/}
                    {/*</div>*/}
                    {/*<div className="row input-row">*/}
                    {/*<div className="col-md-4">*/}
                    {/*</div>*/}
                    {/*<div className="col-md-4">*/}
                    {/**/}
                    {/*</div>*/}
                    {/*<div className="col-md-4">*/}
                    {/**/}
                    {/*</div>*/}
                    {/*</div>*/}
                    <div className="row">
                        <div className="col-md-6">
                            <h3>Components Attached</h3>
                            <hr></hr>
                        </div>
                    </div>
                    <div className="row button-row">
                        {list_components}
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <h3>Environments & Phases</h3>
                            <hr></hr>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="card led-stats-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Standard Day </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="">
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Cool White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_day.cool_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_day', 'cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Warm White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_day.warm_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_day', 'warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Blue</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_day.blue}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_day', 'blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Green</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_day.green}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_day', 'green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_day.red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_day', 'red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Far Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_day.far_red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_day', 'far_red')}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="txt_smaller">
                                                <div className="row time-row">
                                                    <div className="col-md-2">
                                                        From
                                                    </div>
                                                <div className="col-md-4">
                                                    <TimePicker
                                                        style={{width: 150}}
                                                        showSecond={showSecond}
                                                        defaultValue={moment()}
                                                        className="xxx"
                                                        onChange={this.timeonChange.bind(this, "led_off_from")}
                                                    />
                                                </div>
                                                    <div className="col-md-2">
                                                        To
                                                    </div>
                                                <div className="col-md-4"> <TimePicker
                                                    style={{width: 150}}
                                                    showSecond={showSecond}
                                                    defaultValue={moment()}
                                                    className="xxx"
                                                    onChange={this.timeonChange.bind(this, "led_off_to")}
                                                /> </div>
                                            </div>
                                                </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-8"><h6>Light Intensity (watts)</h6></div>
                                    <div className="col-md-4"><Input type="text" placeholder="100"></Input></div>


                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-8"><h6>Light Illumination Distance (cm)</h6></div>
                                    <div className="col-md-4"><Input type="text" placeholder="10"></Input></div>

                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-8"><h6>Air Temperature (celsius)</h6></div>
                                    <div className="col-md-4"><Input type="text" placeholder="22"></Input></div>

                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card led-stats-card">
                                <div className="card-block">
                                    <h4 className="card-title "> Standard Night </h4>
                                    <div className="card-text">
                                        <div className="graph">
                                            <div className="">
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Cool White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_night.cool_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_night', 'cool_white')}/>
                                                    </div>
                                                </div>

                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Warm White</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_night.warm_white}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_night', 'warm_white')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Blue</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_night.blue}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_night', 'blue')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Green</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_night.green}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_night', 'green')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_night.red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_night', 'red')}/>
                                                    </div>
                                                </div>
                                                <div className="row colors-row">
                                                    <div className="col-md-6">
                                                        <span>Far Red</span>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Slider min={0} max={255}
                                                                defaultValue={this.state.standard_night.far_red}
                                                                handle={handle}
                                                                onChange={this.sliderChange.bind(this, 'standard_night', 'far_red')}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="txt_smaller">
                                                <div className="row time-row">
                                                    <div className="col-md-2">
                                                        From
                                                    </div>
                                                <div className="col-md-4">
                                                    <TimePicker
                                                        style={{width: 150}}
                                                        showSecond={showSecond}
                                                        defaultValue={moment()}
                                                        className="xxx"
                                                        onChange={this.timeonChange.bind(this, "led_off_from")}
                                                    />
                                                </div>
                                                    <div className="col-md-2">
                                                        To
                                                    </div>
                                                <div className="col-md-4"> <TimePicker
                                                    style={{width: 150}}
                                                    showSecond={showSecond}
                                                    defaultValue={moment()}
                                                    className="xxx"
                                                    onChange={this.timeonChange.bind(this, "led_off_to")}
                                                /> </div>
                                            </div>
                                                </span>


                                        </div>
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-8"><h6>Light Intensity (watts)</h6></div>
                                    <div className="col-md-4"><Input type="text" placeholder="100"></Input></div>


                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-8"><h6>Light Illumination Distance (cm)</h6></div>
                                    <div className="col-md-4"><Input type="text" placeholder="10"></Input></div>

                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-8"><h6>Air Temperature (celsius)</h6></div>
                                    <div className="col-md-4"><Input type="text" placeholder="22"></Input></div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal isOpen={this.state.peripheral_details_modal}
                       toggle={this.togglePeripheralModal.bind(this, "", "")}
                       className={this.props.className}>
                    <ModalHeader
                        toggle={this.togglePeripheralModal.bind(this, "", "")}>{this.state.selected_peripheral.name}</ModalHeader>
                    <ModalBody>
                        <Form>
                            <FormGroup>
                                {this.state.selected_component_fields}
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.handlePeripheralSubmit}>Submit</Button>{' '}
                        <Button color="secondary"
                                onClick={this.togglePeripheralModal.bind(this, "", "")}>Cancel</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}

export default withCookies(NewRecipe);
