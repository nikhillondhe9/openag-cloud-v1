import React, {Component} from 'react';
import {Cookies, withCookies} from "react-cookie";
import '../scss/recipe_history.scss';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';

import {ImageUploader} from './components/image_uploader';
import {CreateAccessCodeModal} from './components/create_access_code_modal.js';

import * as api from './utils/api';

class RecipeHistory extends Component {
    constructor(props) {
        super(props);
        let recipe_uuid = this.props.match.params.recipe_uuid;
        let device_uuid = this.props.match.params.device_uuid;
        this.state = {

        };
        this.getDeviceHistory = this.getDeviceHistory.bind(this);

    }

    componentDidMount() {
        this.recipe_uuid = this.props.match.params.recipe_uuid;
        this.device_uuid = this.props.match.params.device_uuid;
        this.getDeviceHistory();
    }

    getDeviceHistory()
    {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_device_recipe_history/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'recipe_uuid': this.recipe_uuid,
                'device_uuid':this.device_uuid
            })
        })
            .then(response => response.json())
            .then(responseJson => {
                console.log(responseJson)
            })
            .catch(error => {
                console.error(error);
            })
    }

    render() {

        return (
            <div className="recipe-history-container">

            </div>
        )
    }
}

export default withCookies(RecipeHistory);
