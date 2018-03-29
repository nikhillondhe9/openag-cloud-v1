import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import './add_device.css';

class addDevice extends Component {
    constructor(props) {


        super(props);
        this.username = this.props.match.params.username
        this.state = {
            showModal: false
        };
    }

    render() {

        return (
            <Router>
                <div className="addDevice-container">
                    <div className="name-row">
                        <div className="col-md-10 cell-col">
                            <h2>Please add a new device </h2>
                        </div>
                    </div>
                </div>
            </Router>



        );
    }
}

export default addDevice;
