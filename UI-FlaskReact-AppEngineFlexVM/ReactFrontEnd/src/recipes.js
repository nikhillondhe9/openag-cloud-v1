import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import logo from './logo.png';
import './recipes.css';

class recipes extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <Router>
            <div className="home-container">
                <div className="input-row"><input></input></div>
                <div className="row card-row">
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Card title</h5>
                                <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
                                <p className="card-text">Some quick example text to build on the card title and make up the
                                    bulk of the card's content.</p>
                                <a href="#" className="card-link">Go to device</a>

                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Card title</h5>
                                <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
                                <p className="card-text">Some quick example text to build on the card title and make up the
                                    bulk of the card's content.</p>
                                <a href="#" className="card-link">Go to device</a>

                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Card title</h5>
                                <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
                                <p className="card-text">Some quick example text to build on the card title and make up the
                                    bulk of the card's content.</p>
                                <a href="#" className="card-link">Go to device</a>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </Router>

        );
    }
}

export default recipes;
