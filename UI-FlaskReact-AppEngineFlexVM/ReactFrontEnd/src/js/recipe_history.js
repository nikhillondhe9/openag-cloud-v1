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
        this.state = {

        };

    }

    componentDidMount() {

    }



    render() {

        return (
            <div className="recipe-history-container">

            </div>
        )
    }
}

export default withCookies(RecipeHistory);
