import React, {Component} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import '../scss/home.scss';
import {Button, Input} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";
import placeholder from "../images/no-image.png";
import notification from '../images/notification.png';
import {Timeline} from 'react-twitter-widgets'

import {ImageTimelapse} from './components/image_timelapse';
import {DevicesDropdown} from './components/devices_dropdown';
import {AddDeviceModal} from './components/add_device_modal';
import {AddAccessCodeModal} from './components/add_access_code_modal';
import {Circle, Line} from 'rc-progress';

import * as api from './utils/api';

class Home extends Component {
    constructor(props) {
        super(props);
        this.user_uuid = this.props.location.pathname.replace("/home/", "").replace("#", "")
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            add_device_modal: false,
            add_device_error_message: '',
            add_access_modal: false,
            access_code_error_message: '',
            user_uuid: this.user_uuid,
            user_devices: new Map(),
            selected_device: 'Loading',
            device_images: [placeholder],
            current_plant_type: '',
            current_recipe_runtime: '',
            current_temp: '',
            progress: 10.0,
            age_in_days: 10,
            social_selected: "twitter",
            posts: [],
            user_posts: [],
            user_discourse_posts: [],
            discourse_type: "yours"
        };

        // This binding is necessary to make `this` work in the callback
        this.getUserDevices = this.getUserDevices.bind(this);
        this.postToTwitter = this.postToTwitter.bind(this);
        this.postToDiscourse = this.postToDiscourse.bind(this);
        this.setSocial = this.setSocial.bind(this);
        this.getCurrentNewPosts = this.getCurrentNewPosts.bind(this)
        this.getUserDiscoursePosts = this.getUserDiscoursePosts.bind(this)
        this.changeDiscourseType = this.changeDiscourseType.bind(this)
    }

    componentWillMount() {
        if (this.props.cookies.get('user_token') === '' || this.props.cookies.get('user_token') === undefined || this.props.cookies.get('user_token') === "undefined") {
            window.location.href = "/login"
        }

    }

    componentDidMount() {
        console.log("Mouting component")
        this.getUserDevices()
    }

    setSocial(social) {
        this.setState({"social_selected": social})
        if (social == "discourse") {
            this.getUserDiscoursePosts()


        }
    }

    getUserDiscoursePosts() {
        let results = [{
            "post_id": "16"
        }]
        this.setState({"user_discourse_posts": results})
        this.getCurrentNewPosts()
        // return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_user_discourse_posts/', {
        //     method: 'POST',
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json',
        //         'Access-Control-Allow-Origin': '*'
        //     },
        //     body: JSON.stringify({
        //         'user_token': this.props.cookies.get('user_token'),
        //         'user_uuid': this.state.user_uuid
        //     })
        // })
        //     .then(response => response.json())
        //     .then(responseJson => {
        //
        //         // let results = responseJson["results"]
        //         let results = [{
        //             "post_id":"16"
        //         }]
        //         this.setState({"user_discourse_posts": results})
        //          this.getCurrentNewPosts()
        //     })
        //     .catch(error => {
        //         console.error(error);
        //     })
    }

    changeDiscourseType(type) {
        this.setState({"discourse_type": type})
    }

    getCurrentNewPosts() {
        let api_key_discourse = "5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394"
        let discourse_topic_url = "https://forum.openag.media.mit.edu/t/test-openag-test-test-test/3705"
        return fetch(discourse_topic_url + ".json?api_key=5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394&api_username=openag", {
            method: 'GET'
        })
            .then(response => response.json())
            .then(responseJson => {
                let posts = []
                let user_posts = []
                let post_stream = responseJson["post_stream"]["posts"]
                for (let post of post_stream) {
                    var div = document.createElement("div");
                    div.innerHTML = post["cooked"];
                    console.log(this.state.user_discourse_posts, "FGD")
                    if (post["yours"] == true) {
                        user_posts.push({
                            "avatar": "https://discourse-cdn-sjc1.com/business6" + post["avatar_template"].replace("{size}", "100"),
                            "username": post["username"],
                            "message": div.textContent
                        })
                    }
                    posts.push({
                        "avatar": "https://discourse-cdn-sjc1.com/business6" + post["avatar_template"].replace("{size}", "100"),
                        "username": post["username"],
                        "message": div.textContent
                    })
                }
                this.setState({"posts": posts})
                this.setState({"user_posts": user_posts})
            })
            .catch(error => {
                console.error(error);
            })
    }

    getCurrentDeviceStatus(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_current_device_status/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_uuid': device_uuid
            })
        })
            .then(response => response.json())
            .then(responseJson => {

                let results = responseJson["results"]
                this.setState({wifi_status: results["wifi_status"]})
                this.setState({current_temp: results["current_temp"]})
                // this.setState({progress: results["progress"]})
                // this.setState({age_in_days: results["age_in_days"]})
            })
            .catch(error => {
                console.error(error);
            })
    }

    getDeviceImages(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_device_images/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_uuid': device_uuid
            })
        })
            .then(response => response.json())
            .then(responseJson => {
                this.setState({
                    device_images: responseJson['image_urls']
                });
            })
            .catch(error => {
                console.error(error);
            })
    }

    getCurrentRecipeInfo(device_uuid) {
        api.getCurrentRecipeInfo(
            this.props.cookies.get('user_token'),
            device_uuid
        ).then(response => {
            console.log(response, "SS")
            this.setState({
                current_recipe_uuid: response.recipe_uuid,
                current_plant_type: response.plant_type,
                current_recipe_runtime: response.runtime
            })
        });
    }

    getUserDevices() {
        console.log(process.env.REACT_APP_FLASK_URL, "X")
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_user_devices/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    const devices = responseJson["results"]["devices"];
                    this.setState({"user_uuid": responseJson["results"]["user_uuid"]})
                    let devices_map = new Map();
                    for (const device of devices) {
                        devices_map.set(device['device_uuid'], device);
                    }

                    this.setState({
                        user_devices: devices_map
                    }, () => {
                        if (!this.restoreSelectedDevice()) {
                            // default the selected device to the first/only dev.
                            this.onSelectDevice(devices[0].device_uuid)
                        }
                    });
                    console.log("Response", responseJson["results"])
                } else {
                    this.setState({
                        selected_device: 'No Devices',
                        selected_device_uuid: ''
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    restoreSelectedDevice = () => {
        const saved_device_uuid = this.props.cookies.get('selected_device_uuid', {path: '/'});
        if (!saved_device_uuid) return;

        const device = this.state.user_devices.get(saved_device_uuid);
        if (device) {
            this.onSelectDevice(saved_device_uuid);
            return true;
        }
        return false;
    }

    saveSelectedDevice = () => {
        const selected_device_uuid = this.state.selected_device_uuid;
        console.log(selected_device_uuid);
        if (selected_device_uuid) {
            this.props.cookies.set('selected_device_uuid', selected_device_uuid, {path: '/'});
        } else {
            this.props.cookies.remove('selected_device_uuid', {path: '/'});
        }
    }

    toggleDeviceModal = () => {
        this.setState(prevState => {
            return {
                add_device_modal: !prevState.add_device_modal,
                add_device_error_message: ''
            }
        });
    }

    toggleAccessCodeModal = () => {
        this.setState(prevState => {
            return {
                add_access_modal: !prevState.add_access_modal,
                access_code_error_message: ''
            }
        });
    }

    onSubmitDevice = (modal_state) => {
        console.log(modal_state);
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_name': modal_state.device_name,
                'device_reg_no': modal_state.device_reg_no,
                'device_notes': modal_state.device_notes,
                'device_type': modal_state.device_type
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.toggleDeviceModal();
                    this.getUserDevices()
                } else {
                    this.setState({
                        add_device_error_message: responseJson["message"]
                    })
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    onSubmitAccessCode = (modal_state) => {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/submit_access_code/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'access_code': modal_state.access_code
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.toggleAccessCodeModal();
                    this.getUserDevices();
                } else {
                    this.setState({
                        access_code_error_message: responseJson['message']
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    postToDiscourse() {
        console.log("D")
        return fetch("https://forum.openag.media.mit.edu/posts.json", {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            title:"Hello this is my title.",
            body: JSON.stringify({
                "topic_id":3705,
                "api_key":"5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394",
                "body":"raw test post for disc",
                "raw":"This is a raw "

            })

        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)


            })
            .catch((error) => {
                console.error(error);
            });
    }

    postToTwitter() {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/posttwitter/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                // if (responseJson["response_code"] == 200) {
                //     // this.setState({user_devices: responseJson["results"]})
                // }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    onSelectDevice = (device_uuid) => {
        if (device_uuid != this.state.selected_device_uuid) {
            const device = this.state.user_devices.get(device_uuid);
            const name = `${device.device_name} (${device.device_reg_no})`;
            this.setState({
                selected_device: name,
                selected_device_uuid: device.device_uuid
            }, () => {
                this.getCurrentRecipeInfo(device_uuid);
                this.saveSelectedDevice();
                this.getDeviceImages(device_uuid);
                this.getCurrentDeviceStatus(device_uuid);
            });
        }
    }

    render() {

        console.log(this.state.user_uuid, "FDFD")

        let discourse_messages = this.state.posts.map((post) => {
            return (
                <div className="row">
                    <div className="col-md-2">
                        <img src={post["avatar"]} width="30" height="30"/>
                    </div>
                    <div className="col-md-10">
                        <div className="row"><b>{post["username"]}</b></div>
                        <div className="row">{post["message"]}</div>
                    </div>
                </div>
            )
        });


        let user_discourse_messages = this.state.user_posts.map((post) => {
            return (
                <div className="row">
                    <div className="col-md-2">
                        <img src={post["avatar"]} width="30" height="30"/>
                    </div>
                    <div className="col-md-10">
                        <div className="row"><b>{post["username"]}</b></div>
                        <div className="row">{post["message"]}</div>
                    </div>
                </div>
            )
        });
        let gotohistory = "/recipe_history/" + this.state.selected_device_uuid + "/" + this.state.current_recipe_uuid;
        return (
            <Router>
                <div className="home-container">
                    <DevicesDropdown
                        devices={[...this.state.user_devices.values()]}
                        selectedDevice={this.state.selected_device}
                        onSelectDevice={this.onSelectDevice}
                        onAddDevice={this.toggleDeviceModal}
                        onAddAccessCode={this.toggleAccessCodeModal}
                    />
                    {/*<Button className="postbutton" onClick={this.postToTwitter}>*/}
                    {/*Post status to twitter*/}
                    {/*</Button>*/}
                    <div className="card notifications">
                        <div className="card-body">
                            <div className="card-title">
                                <h3>Notifications</h3>
                                <img src={notification}/>
                            </div>
                            {this.state.current_plant_type ? (
                                <p>
                                    Your {this.state.current_plant_type} is {this.state.current_recipe_runtime}
                                    &nbsp;old. Congratulations!
                                </p>
                            ) : (
                                <p>
                                    Loading recipe information.
                                </p>
                            )}
                            <hr/>
                            <p><a href={gotohistory}>See edits </a> to your recipes </p>
                            <hr/>
                            <p> Water needs refilling soon </p>
                        </div>
                    </div>
                    <div className="timelapse">
                        <ImageTimelapse
                            imageClass="timelapse-img"
                            inputClass="range-slider__range"
                            images={this.state.device_images}
                        />
                    </div>
                    <div className="status">
                        <div className="row">
                            <div className="col-md-4">Wifi Status</div>
                            <div className="col-md-8"> {this.state.wifi_status} </div>
                        </div>

                        <div className="row">

                            <div className="col-md-6">
                                <div className="row">
                                    <div className="col-md-8">Device Status</div>
                                    <div className="col-md-4">
                                   <span class="checkmark">
                                     <div class="checkmark_circle"></div>

                                    </span>
                                        <span className="checkmark-text">OK</span>
                                    </div>

                                </div>
                            </div>

                        </div>

                        <div className="row">
                            <div className="col-md-4">
                                Progress
                            </div>
                            <div className="col-md-8 float-right">
                                <div className="row">
                                    <Line percent={this.state.progress} strokeWidth="4" trailWidth="4"
                                          strokeColor="#378A49"
                                          strokeLinecap="round"/>
                                </div>
                                <div className="row">
                                    Day {this.state.age_in_days}
                                </div>

                            </div>
                        </div>

                        <div className="row">

                            <div className="col-md-6">Temperature</div>
                            <div className="col-md-6">

                                {this.state.current_temp}
                            </div>

                        </div>

                    </div>

                    <div className="twitter">
                        <div className="row">
                            <div className="col-md-4">
                                <Button onClick={this.setSocial.bind(this, "twitter")}>Twitter</Button>
                            </div>
                            <div className="col-md-2">
                            </div>
                            <div className="col-md-4">
                                <Button onClick={this.setSocial.bind(this, "discourse")}>Discourse</Button>
                            </div>
                            <div className="col-md-2">
                            </div>
                        </div>
                        {this.state.social_selected === "twitter" ? <div className="row">
                            <Timeline
                                dataSource={{
                                    sourceType: 'profile',
                                    screenName: 'food_computer'
                                }}
                                options={{
                                    username: 'FoodComputer'
                                }}
                                onLoad={() => console.log('Timeline is loaded!')}
                            /></div> : <div className="discourse-container">
                            <div className="row">
                                <div className="col-md-6"><Button onClick={this.changeDiscourseType.bind(this, "all")}>All</Button>
                                </div>
                                <div className="col-md-2"><Button
                                    onClick={this.changeDiscourseType.bind(this, "yours")}>Yours</Button></div>
                            </div>
                            {this.state.discourse_type === "all" ? discourse_messages : user_discourse_messages}
                        </div>}
                        <div className="row">
                            <div className="col-md-8">
                                <Input placeholder="Post your message" name="discourse_message" id="discourse_message"/>
                            </div>
                            <div className="col-md-2">
                                <Button onClick={this.postToDiscourse}>POST</Button>
                            </div>
                        </div>
                    </div>


                    <AddDeviceModal
                        isOpen={this.state.add_device_modal}
                        toggle={this.toggleDeviceModal}
                        onSubmit={this.onSubmitDevice}
                        error_message={this.state.add_device_error_message}
                    />
                    <AddAccessCodeModal
                        isOpen={this.state.add_access_modal}
                        toggle={this.toggleAccessCodeModal}
                        onSubmit={this.onSubmitAccessCode}
                        error_message={this.state.access_code_error_message}
                    />
                </div>
            </Router>


        );
    }
}

export default withCookies(Home);
