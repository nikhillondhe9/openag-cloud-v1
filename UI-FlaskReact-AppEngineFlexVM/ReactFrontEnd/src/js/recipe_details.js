import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import "../css/recipe_details.css";

class RecipeDetails extends Component {
    constructor(props) {
        super(props);
        this.recipe_uuid = this.props.location.pathname.replace("/recipe_details/", "").replace("#", "")
        this.state = {
            recipe_name: "",
            recipe_plant:"",
            recipe_uuid: this.recipe_uuid,
            recipe_json:{},
            components:[]
        };
        this.getRecipeDetails = this.getRecipeDetails.bind(this);

    }

    componentDidMount() {
        this.getRecipeDetails()
    }

    getRecipeDetails() {
        return fetch("http://food.computer.com:5000/api/get_recipe_details/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'recipe_uuid': this.state.recipe_uuid,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let resultJson = responseJson["results"][0]
                    this.setState({recipe_name:resultJson["recipe_name"]})
                    this.setState({recipe_plant:resultJson["recipe_plant"]})
                    this.setState({modified_at:resultJson["modified_at"]})
                    this.setState({recipe_json:JSON.parse(resultJson["recipe_json"])})
                    this.setState({components:(resultJson["components"])})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {
        let listComponents = this.state.components.map((component) => {
            return (<div className="row" key={component.component_id}>
                <div className="col-md-4">
                     {component.component_label}
                </div>
                <div className="col-md-2">
                    {component.component_type}
                </div>
                <div className="col-md-6">
                    {component.component_description}
                </div>
            </div>)
        });
        let recipeParams = this.state.components.map(function(component) {
            let component_key = component.component_key
            let component_json = component.field_json
            let component_field_label = component_json["field_label"]
            let component_field_units = component_json["field_units"]
            let component_value = this.state.recipe_json[component_key]
            if (component_key !== "LED_panel") {
                return (
                    <div key={component_key}>
                        <div className="row"><div className="col-md-6"> <b> {component.component_label} </b> </div></div>
                        <div className="row">
                            <div className="col-md-6">
                                {component_field_label}
                            </div>
                            <div className="col-md-4">
                                {component_value}
                            </div>
                            <div className="col-md-2">
                                {component_field_units}
                            </div>
                        </div>
                    </div>
                )
            }
            else if(component_key === "LED_panel")
            {
                let off_far_red = this.state.recipe_json["LED_panel_off_far_red"]
                let off_red = this.state.recipe_json["LED_panel_off_red"]
                let off_warm_white = this.state.recipe_json["LED_panel_off_warm_white"]
                let off_green = this.state.recipe_json["LED_panel_off_green"]
                let off_cool_white = this.state.recipe_json["LED_panel_off_cool_white"]
                let off_blue  = this.state.recipe_json["LED_panel_off_blue"]
                let on_far_red = this.state.recipe_json["LED_panel_on_far_red"]
                let on_red = this.state.recipe_json["LED_panel_on_red"]
                let on_warm_white = this.state.recipe_json["LED_panel_on_warm_white"]
                let on_green = this.state.recipe_json["LED_panel_on_green"]
                let on_cool_white = this.state.recipe_json["LED_panel_on_cool_white"]
                let on_blue  = this.state.recipe_json["LED_panel_on_blue"]

                return (<div key={component_key}>
                        <div className="row"><div className="col-md-6"> <b> {component.component_label} </b> </div></div>
                        <div className="row">
                            <div className="col-md-6"> <i> LED Panel - While OFF </i></div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">Far Red</div>
                            <div className="col-md-6">{off_far_red}</div>
                        </div>
                    <div className="row">
                            <div className="col-md-6">Red</div>
                            <div className="col-md-6">{off_red}</div>
                        </div>
                    <div className="row">
                            <div className="col-md-6">Warm White</div>
                            <div className="col-md-6">{off_warm_white}</div>
                        </div><div className="row">
                            <div className="col-md-6">Cool White</div>
                            <div className="col-md-6">{off_cool_white}</div>
                        </div>
                    <div className="row">
                            <div className="col-md-6">Green</div>
                            <div className="col-md-6">{off_green}</div>
                        </div>
                    <div className="row">
                        <div className="col-md-6"><i> LED Panel - While on </i></div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">Far Red</div>
                            <div className="col-md-6">{on_far_red}</div>
                        </div>
                    <div className="row">
                            <div className="col-md-6">Red</div>
                            <div className="col-md-6">{on_red}</div>
                        </div>
                    <div className="row">
                            <div className="col-md-6">Warm White</div>
                            <div className="col-md-6">{on_warm_white}</div>
                        </div><div className="row">
                            <div className="col-md-6">Cool White</div>
                            <div className="col-md-6">{on_cool_white}</div>
                        </div>
                    <div className="row">
                            <div className="col-md-6">Green</div>
                            <div className="col-md-6">{on_green}</div>
                        </div>

                    </div>)
            }
        },this);
        return (
            <div className="home-container">
                <div className="row home-row">
                    <div className="col-md-4 img-col">
                        <img src="http://placehold.it/500x500/f4c242/black/"/>
                    </div>
                    <div className="col-md-8">
                        <h4>{this.state.recipe_name} for {this.state.recipe_plant}</h4>
                        <p>Author: <i>Rob</i></p>
                        <p><span><b> Plant description  : </b> </span> {this.state.recipe_json.plant_description}</p>
                        <p><span><b> Recipe description : </b></span> {this.state.recipe_json.recipe_description}</p>
                        <h4>Components Needed :</h4>
                        <div>{listComponents}</div>
                        <h4>Climate Recipe Parameters :</h4>
                        <div>{recipeParams}</div>
                    </div>

                </div>
            </div>

        )
    }
}

export default withCookies(RecipeDetails);
