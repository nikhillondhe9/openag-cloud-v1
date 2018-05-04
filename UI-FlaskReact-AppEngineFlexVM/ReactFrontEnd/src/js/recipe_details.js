import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import "../css/recipe_details.css";
import arugula from "../arugula.jpg";

class RecipeDetails extends Component {
    constructor(props) {
        super(props);
        this.recipe_uuid = this.props.location.pathname.replace("/recipe_details/", "").replace("#", "")
        this.state = {
            recipe_name: "",
            recipe_plant: "",
            recipe_uuid: this.recipe_uuid,
            recipe_json: {},
            components: [],
            history: {}
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
                    this.setState({recipe_name: resultJson["recipe_name"]})
                    this.setState({recipe_plant: resultJson["recipe_plant"]})
                    this.setState({modified_at: resultJson["modified_at"]})
                    this.setState({recipe_json: JSON.parse(resultJson["recipe_json"])})
                    this.setState({components: (resultJson["components"])})
                    this.setState({history: responseJson["history"]})
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }


    render() {
        let flatten = function (arr) {
            return arr.reduce(function (flat, toFlatten) {
                return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
            }, []);
        };
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
        let history_json = this.state.history;
        let history_records = Object.keys(history_json).map((item, i) => {
                let history_record_json = history_json[item]
                let records = history_record_json.map((history_ob) => {
                    let list_of_changes = history_ob["changes_in_record"].map((change) => {
                        return <li>{change}</li>
                    })
                    return (<div key={item}>
                        <div className="row">
                            <div className="col-md-4 history-col"> {item}</div>
                            <div className="col-md-4 history-col"> {history_ob["recipe_session_token"]}</div>
                            <div className="col-md-4 history-col">
                                <ul> {list_of_changes} </ul>
                            </div>

                        </div>
                        <hr/>
                    </div>)
                });
                return (records)
            }
        );

        let html_history_records = flatten(history_records)
        this.state.components.map((component) => {
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

        let recipeParams = this.state.components.map(function (component) {
            let component_key = component.component_key
            let component_json = component.field_json
            let component_field_label = component_json["field_label"]
            let component_field_units = component_json["field_units"]
            let component_value = this.state.recipe_json[component_key]
            if (component_key !== "LED_panel") {
                return (
                    <div key={component_key}>
                        <div className="row">
                            <div className="col-md-6"><b> {component.component_label} </b></div>
                        </div>

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
            else if (component_key === "LED_panel") {
                let off_far_red = this.state.recipe_json["LED_panel_off_far_red"]
                let off_red = this.state.recipe_json["LED_panel_off_red"]
                let off_warm_white = this.state.recipe_json["LED_panel_off_warm_white"]
                let off_green = this.state.recipe_json["LED_panel_off_green"]
                let off_cool_white = this.state.recipe_json["LED_panel_off_cool_white"]
                let off_blue = this.state.recipe_json["LED_panel_off_blue"]
                let on_far_red = this.state.recipe_json["LED_panel_on_far_red"]
                let on_red = this.state.recipe_json["LED_panel_on_red"]
                let on_warm_white = this.state.recipe_json["LED_panel_on_warm_white"]
                let on_green = this.state.recipe_json["LED_panel_on_green"]
                let on_cool_white = this.state.recipe_json["LED_panel_on_cool_white"]
                let on_blue = this.state.recipe_json["LED_panel_on_blue"]

                return (<div key={component_key}>
                    <div className="row">
                        <div className="col-md-6"><b> {component.component_label} </b></div>
                    </div>
                    <div className="row">
                        <div className="col-md-6"><i> LED Panel - While OFF </i></div>
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
                    </div>
                    <div className="row">
                        <div className="col-md-6">Cool White</div>
                        <div className="col-md-6">{off_cool_white}</div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">Green</div>
                        <div className="col-md-6">{off_green}</div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">Blue</div>
                        <div className="col-md-6">{off_blue}</div>
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
                    </div>
                    <div className="row">
                        <div className="col-md-6">Cool White</div>
                        <div className="col-md-6">{on_cool_white}</div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">Green</div>
                        <div className="col-md-6">{on_green}</div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">Blue</div>
                        <div className="col-md-6">{on_blue}</div>
                    </div>

                </div>)
            }
        }, this);
        return (
            <div className="home-container">
                <div className="row">
                    <div className="col-md-4">
                        <a href="/recipes"> Back to climate recipes</a>
                    </div>
                </div>
                <div className="row home-row">
                    <div className="col-md-3 img-col">
                        <img src={arugula}/>
                    </div>

                    <div className="col-md-9">

                        <div className="row card-row">
                            <h3>{this.state.recipe_name}
                                for {this.state.recipe_plant}  </h3>
                        </div>
                           
                        <div className="row card-row">
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="card-title">Plant Notes</div>
                                        <div className="card-text">
                                            {this.state.recipe_json.plant_description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="card-title">Recipe Notes</div>
                                        <div className="card-text">
                                            {this.state.recipe_json.recipe_description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row card-row">

                            <h3>Components used in this climate recipe </h3>

                        </div>
                        <div className="row card-row">
                            <div className="col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        {/*<div className="card-title"></div>*/}
                                        <div className="card-text">
                                            {listComponents}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row card-row">

                            <h3>Parameters of the Climate Recipe </h3>

                        </div>
                        <div className="row card-row">
                            <div className="col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        {/*<div className="card-title"></div>*/}
                                        <div className="card-text">
                                            {recipeParams}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row card-row">

                            <h3>Recipe History on your devices </h3>

                        </div>
                        <div className="row card-row">
                            <div className="col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="card-title">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <b> Recipe session token </b>
                                                </div>
                                                <div className="col-md-4">
                                                    <b> Device UUID </b>
                                                </div>
                                                <div className="col-md-4">
                                                    <b> Change Summary </b>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-text">
                                            {html_history_records}
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

export default withCookies(RecipeDetails);
