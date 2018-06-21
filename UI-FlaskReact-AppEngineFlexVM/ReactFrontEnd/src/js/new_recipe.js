import React, {Component} from 'react';
import '../css/new_recipe.css';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import {Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Input} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";
import 'rc-time-picker/assets/index.css';
import {ImageUploader} from './components/image_uploader'

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
            plant_type_dropdown_toggle: false,
            device_type_dropdown_toggle: false,
            plant_variant_dropdown_toggle: false,
            device_type_caret: 'Choose a Device Type',
            plant_type_caret: 'Choose a Plant Type',
            variant_type_caret: 'Choose the plant variant',
            peripherals: [],
            device_types: [],
            plant_types: [],
            plant_variants: [],
            selected_peripherals: [],
            selected_variants: [],
            recipe_name: "",
            recipe_description: "",
            image_url: "http://via.placeholder.com/200x200"
        }
        this.device_type_dropdowntoggle = this.device_type_dropdowntoggle.bind(this);
        this.plant_type_dropdowntoggle = this.plant_type_dropdowntoggle.bind(this);
        this.plant_variant_type_dropdowntoggle = this.plant_variant_type_dropdowntoggle.bind(this);
        this.get_peripherals = this.get_peripherals.bind(this);
        this.togglePeripheralModal = this.togglePeripheralModal.bind(this);
        this.handlePeripheralSubmit = this.handlePeripheralSubmit.bind(this);
        this.sensorOnChange = this.sensorOnChange.bind(this);
        this.submitRecipe = this.submitRecipe.bind(this);
        this.getDropdownValues = this.getDropdownValues.bind(this);
        this.changeDeviceType = this.changeDeviceType.bind(this);
        this.changePlantType = this.changePlantType.bind(this);
        this.onImageUpload = this.onImageUpload.bind(this);
        this.changeVariantType = this.changeVariantType.bind(this);
    }

    onImageUpload(response) {
        if (response.response_code == 200) {
            this.setState({image_url: response.url});
        } else {
            console.error('Image upload failed');
        }
    }

    handlePeripheralSubmit() {

    }

    togglePeripheralModal(peripheral_json) {

    }

    submitRecipe() {
        return fetch(process.env.REACT_APP_FLASK_URL + "/api/submit_recipe/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'recipe_uuid': this.state.recipe_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'state': this.state
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let resultJson = responseJson["results"]
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    get_peripherals(selected_peripherals) {
        return fetch(process.env.REACT_APP_FLASK_URL + "/api/get_device_peripherals/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'selected_peripherals': selected_peripherals,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let resultJson = responseJson["results"]
                    this.setState({peripherals: resultJson})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }


    plant_variant_type_dropdowntoggle() {
        this.setState(prevState => ({
            plant_variant_dropdown_toggle: !prevState.plant_variant_dropdown_toggle
        }));
    }

    device_type_dropdowntoggle() {
        this.setState(prevState => ({
            device_type_dropdown_toggle: !prevState.device_type_dropdown_toggle
        }));
    }

    plant_type_dropdowntoggle() {
        this.setState(prevState => ({
            plant_type_dropdown_toggle: !prevState.plant_type_dropdown_toggle
        }));
    }

    componentDidMount() {

    }

    changeVariantType(variant) {
        this.setState({variant_type_caret: variant})
    }

    changePlantType(plant_type_name) {
        let selected_plant_type = "ERROR";
        let selected_variants = "";
        for (let plant_type_json of this.state.plant_types) {

            if (plant_type_json.name === plant_type_name) {
                selected_plant_type = plant_type_json.name
                selected_variants = plant_type_json.variants
            }
        }
        this.setState({plant_type_caret: selected_plant_type})
        this.setState({selected_variants: selected_variants.split(",")})
    }

    changeDeviceType(device_type_id, value) {

        let selected_device_type = "ERROR";
        let selected_peripherals = "";
        for (let device_type_json of this.state.device_types) {
            console.log(device_type_id, device_type_json)
            if (device_type_json.device_type_id === device_type_id) {
                selected_device_type = device_type_json.name
                selected_peripherals = device_type_json.peripherals
            }
        }
        this.setState({device_type_caret: selected_device_type})
        this.setState({selected_peripherals: selected_peripherals})
        this.get_peripherals(selected_peripherals)
    }

    getDropdownValues() {
        fetch(process.env.REACT_APP_FLASK_URL + "/api/get_device_types/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({})
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                this.setState({device_types: responseJson['results']})

            })
            .catch((error) => {
                console.error(error);
            });

        fetch(process.env.REACT_APP_FLASK_URL + "/api/get_plant_types/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({})
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                this.setState({plant_types: responseJson["results"]})
            })
            .catch((error) => {
                console.error(error);
            });

        return
    }

    componentWillMount() {
        this.getDropdownValues()
    }

    sliderChange(color_channel, value) {

        this.setState({[color_channel]: value})
        console.log(color_channel, value)
        this.setState({["led_off_border"]: "3px solid #883c63"})
    }

    sensorOnChange(e) {
        if (e.target.name === "standard_day") {
            this.setState({[e.target.name]: e.target.value})
            this.setState({standard_night: 24 - e.target.value})
        }
        this.setState({[e.target.name]: e.target.value})
    }

    render() {

        let list_components = this.state.peripherals.map((peripheral_json) => {

            if (peripheral_json) {
                let peripheral_html = []
                peripheral_html.push(<div className="row label-row">
                    <div className="col-md-6 rounded-col" style={{backgroundColor: peripheral_json.color}}>
                        {peripheral_json.name}
                    </div>
                </div>)
                // Get all the input fields needed to load required fields for this peripheral
                let fields = JSON.parse(peripheral_json.inputs)
                for (let field of fields) {
                    if (field.field_type === "text_input") {
                        peripheral_html.push(
                            <div className="row field-row">
                                <span>Sensor values are published every time environment changes </span>
                            </div>)

                    }
                    if (field.field_type === "led_panel") {

                        peripheral_html.push(<div className="row">
                                <div className="col-md-6">
                                    <div className="card led-stats-card">
                                        <div className="card-block">
                                            <h4 className="card-title "> Choose LED Spectrum for Standard Day </h4>
                                            <div className="card-text">
                                                <div className="graph">
                                                    <div className="">
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Cool White</span>
                                                            </div>
                                                            <div className="col-md-6">

                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_cool_white']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_on_cool_white')}/>
                                                            </div>
                                                        </div>

                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Warm White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_warm_white']}
                                                                        handle={handle}

                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_on_warm_white')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Blue</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_blue']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_on_blue')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Green</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_green']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_on_green')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_red']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_on_red')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Far Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_on_far_red']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_on_far_red')}/>
                                                            </div>
                                                        </div>
                                                    </div>


                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card led-stats-card">
                                        <div className="card-block">
                                            <h4 className="card-title "> Choose LED Spectrum for Standard Night </h4>
                                            <div className="card-text">
                                                <div className="graph">
                                                    <div className="">
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Cool White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_cool_white']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_off_cool_white')}/>
                                                            </div>
                                                        </div>

                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Warm White</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_warm_white']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_off_warm_white')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Blue</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_blue']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_off_blue')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Green</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_green']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_off_green')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_red']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_off_red')}/>
                                                            </div>
                                                        </div>
                                                        <div className="row colors-row">
                                                            <div className="col-md-6">
                                                                <span>Far Red</span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Slider min={0} max={255}
                                                                        defaultValue={this.state[field.state_key + '_off_far_red']}
                                                                        handle={handle}
                                                                        onChange={this.sliderChange.bind(this, field.state_key + '_off_far_red')}/>
                                                            </div>
                                                        </div>
                                                    </div>


                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                }
                return peripheral_html
            }
        });

        let plant_variant_type_dropdown_values = this.state.selected_variants.map((variant) => {
            return (<DropdownItem value={variant}
                                  onClick={this.changeVariantType.bind(this, variant)}> {variant} </DropdownItem>)

        })
        let plant_type_dropdown_values = this.state.plant_types.map((plant_type) => {
            return (<DropdownItem value={plant_type.name}
                                  onClick={this.changePlantType.bind(this, plant_type.name)}> {plant_type.name} </DropdownItem>)

        })
        let device_type_drown_values = this.state.device_types.map((device_type) => {
                return (<DropdownItem value={device_type.device_type_id}
                                      onClick={this.changeDeviceType.bind(this, device_type.device_type_id)}> {device_type.name} </DropdownItem>)
            }
        )
        return (<div className="recipe-container">
                <div className="details-container">
                    <div className="row input-row">
                        <div className="col-md-4">
                        </div>
                        <div className="col-md-4 dropdown-col">
                            <Dropdown isOpen={this.state.device_type_dropdown_toggle}
                                      toggle={this.device_type_dropdowntoggle}
                                      className="row dropdown-row">
                                <DropdownToggle caret>
                                    {this.state.device_type_caret}
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-type">
                                    {device_type_drown_values}
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
                            <Input type="text" className="recipe-details-text" placeholder="Recipe Name"
                                   id="recipe_name" name="recipe_name" onChange={this.sensorOnChange}/>
                            <textarea className="recipe-details-text" placeholder="Recipe Description"
                                      id="recipe_description" name="recipe_description" onChange={this.sensorOnChange}/>
                            <Dropdown isOpen={this.state.plant_variant_dropdown_toggle}
                                      toggle={this.plant_variant_type_dropdowntoggle}
                                      className="row dropdown-row">
                                <DropdownToggle caret>
                                    {this.state.plant_type_caret}
                                </DropdownToggle>
                                <DropdownMenu>
                                    {plant_type_dropdown_values}
                                </DropdownMenu>
                            </Dropdown>
                            <Dropdown isOpen={this.state.plant_type_dropdown_toggle}
                                      toggle={this.plant_type_dropdowntoggle}
                                      className="row dropdown-row">
                                <DropdownToggle caret>
                                    {this.state.variant_type_caret}
                                </DropdownToggle>
                                <DropdownMenu>
                                    {plant_variant_type_dropdown_values}
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <h3>Peripherals Attached</h3>
                            <hr></hr>
                        </div>
                    </div>

                    {list_components}


                    <div className="row">
                        <div className="col-md-6">
                            <h3>Environments & Phases</h3>
                            <hr></hr>
                        </div>
                    </div>
                    <div className="row field-row">
                        <div className="col-md-5 field-col">
                            <div className="row">
                                Standard Day (in hr)
                            </div>
                            <div className="row">
                                <Input type="number" className="recipe-details-text" placeholder="6" id="standard_day"
                                       name="standard_day" onChange={this.sensorOnChange}/>
                            </div>
                        </div>
                        <div className="col-sm-1 field-col">
                        </div>
                        <div className="col-md-5 field-col">
                            <div className="row">
                                Standard Night (in hr)
                            </div>
                            <div className="row">
                                <Input type="number" className="recipe-details-text" placeholder="24hr - Standard Day"
                                       id="standard_night" name="standard_night" value={this.state.standard_night}/>
                            </div>
                        </div>

                    </div>
                    <Button className="submit-recipe-button" onClick={this.submitRecipe}>Submit Recipe</Button>
                </div>

            </div>
        );
    }
}

export default withCookies(NewRecipe);
