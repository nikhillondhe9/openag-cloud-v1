import React, {Component} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import './edit_recipe.css';
import {Form, FormGroup, Input} from 'reactstrap';
import ReactDOM from 'react-dom';

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
        this.buildForm = this.buildForm.bind(this);
        this.getRecipeComponents = this.getRecipeComponents.bind(this);
    }

    componentDidMount() {
        console.log("Mounting component")
        this.getRecipeComponents()
    }

    getRecipeComponents() {
        return fetch('http://food.computer.com:5000/api/get_recipe_components/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'recipe_id': '0'
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    let components = responseJson["results"]
                    this.buildForm(components)
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    createTitle(title) {
        return (<h6 key={title}>
            {title}
        </h6>)
    }

    createInputFields(fields_json) {
        var list_of_fields = fields_json.map((field_json) => {
            if(field_json["key"] === "publishResult_Value")
            {
                var key = field_json["key"]
                return (
                    <div key={key} className="smallInput"><Input type="text" name={key} id={key} placeholder=""
                                                                                   value={this.state.co2_t6713}
                                                                                   onChange={this.handleChange}/>

                    </div>
                )
            }
        });
        return list_of_fields

    }

    buildForm(components) {
        var container = this.refs.container;
        var cards = [<div key='Me'>Me</div>]
        for (let component of components) {
            cards.push(this.createTitle(component["component_description"]));
            cards.push(this.createInputFields(component["fields_json"]));
        }
        ReactDOM.render(<div>{cards}</div>, container);
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

        return <div className="recipe-container" ref="container"/>;
    }
}

export default EditRecipe;
