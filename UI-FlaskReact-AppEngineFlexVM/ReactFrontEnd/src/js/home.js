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
const querystring = require('querystring');

class Home extends Component {
    constructor(props) {
        super(props);

        let all_params = querystring.parse(this.props.location.search)
        if (typeof all_params['user_uuid'] != 'undefined') {
            this.user_uuid = all_params['user_uuid'];
        }

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
            discourse_message: "",
            discourse_type: "yours"
        };
        console.log(this.props)

        // This binding is necessary to make `this` work in the callback
        this.getUserDevices = this.getUserDevices.bind(this);
        this.postToTwitter = this.postToTwitter.bind(this);
        this.postToDiscourse = this.postToDiscourse.bind(this);
        this.setSocial = this.setSocial.bind(this);
        this.getCurrentNewPosts = this.getCurrentNewPosts.bind(this)
        this.getUserDiscoursePosts = this.getUserDiscoursePosts.bind(this)
        this.changeDiscourseType = this.changeDiscourseType.bind(this)
        this.onChangeField = this.onChangeField.bind(this)
        this.goToPost = this.goToPost.bind(this)
        if (typeof all_params["vcode"] != 'undefined') {
            console.log('Showing device reg with code=' + all_params["vcode"]);
            // When we initialize the model, we take this Home.state.vcode and
            // use it to initialize the modal's properties
            this.state.device_reg_no = all_params["vcode"];
            this.state.add_device_modal = true;
        }

    }

    componentWillMount() {
        // if (this.props.cookies.get('user_token') === '' || this.props.cookies.get('user_token') === undefined || this.props.cookies.get('user_token') === "undefined") {
        //     // window.location.href = "/login"
        // }

    }

    componentDidMount() {
        console.log("Mounting Home component")
        this.getUserDevices()
    }

    setSocial(social) {
        this.setState({"social_selected": social})
        if (social == "discourse") {
            this.getUserDiscoursePosts()


        }
    }

    onChangeField(e) {
        this.setState({"discourse_message": e.target.value})
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

    getRepliesOnPost(id,post,user_avatar) {
        console.log("FGF")
        let user_posts = this.state.user_posts
        let url = "https://forum.openag.media.mit.edu/t/" + id + ".json?"
        let discourse_topic_url = url + "api_key=5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394&api_username=openag"
        console.log(discourse_topic_url)
        return fetch(discourse_topic_url, {
            method: 'GET'
        }).then(response => response.json())
                        .then(responseJson => {
                            let post_count = 0
                            console.log(responseJson)
                            post_count = responseJson["posts_count"]
                            if (true) {
                                user_posts.push({
                                    "avatar": "https://discourse-cdn-sjc1.com/business6" + user_avatar.replace("{size}", "100"),
                                    "username": post["last_poster_username"],
                                    "message": post["title"],
                                    "yours": true,
                                    "post_url": "https://forum.openag.media.mit.edu/t/" + post["id"],
                                    "post_count": post_count
                                })

                                this.setState({"user_posts": user_posts})
                            }
                        })
                        .catch(error => {
                            console.error(error);
                        })

    }

    getCurrentNewPosts() {
        let api_key_discourse = "5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394"
        let discourse_topic_url = "https://forum.openag.media.mit.edu/latest.json?api_key=5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394&api_username=openag&category=20"
        return fetch(discourse_topic_url, {
            method: 'GET'
        })
            .then(response => response.json())
            .then(responseJson => {
                let posts = []
                this.setState({"user_posts":[]})
                console.log(responseJson, "FG")
                let post_stream = responseJson["topic_list"]["topics"]
                let users = responseJson["users"]
                for (let post of post_stream) {
                    var div = document.createElement("div");
                    div.innerHTML = post["cooked"];
                    let user_last = post["last_poster_username"]
                    let user_avatar = "http://via.placeholder.com/100x100"
                    for (let user of users) {
                        if (user["username"] == user_last) {
                            user_avatar = user["avatar_template"]
                        }
                    }
                    this.getRepliesOnPost(post["id"],post,user_avatar)

                    posts.push({
                        "avatar": "https://discourse-cdn-sjc1.com/business6" + user_avatar.replace("{size}", "100"),
                        "username": post["last_poster_username"],
                        "message": post["title"],
                        "yours": false,
                        "post_url": "https://forum.openag.media.mit.edu/t/" + post["id"]
                    })
                }
                this.setState({"posts": posts})
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
        var message = this.state.discourse_message;
        var title = message.substring(0, 100)
        return fetch("https://forum.openag.media.mit.edu/posts.json?api_key=5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394&api_username=openag&raw=" + message + "&title=" + title + "&category=20", {
            method: 'POST',
            headers: {},
            title: "Hello this is my title.",
            body: JSON.stringify({
                "api_key": "5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394",
                "body": "raw test post for disc",
                "raw": "This is a raw ",
                "category": 20,
                "api_username": "OpenAg"
            })

        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                this.getCurrentNewPosts()

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

    goToPost(url, e) {
        window.location.href = url
    }

    render() {

        console.log(this.state.user_uuid, "FDFD")

        let discourse_messages = this.state.posts.map((post) => {
            return (
                <div className="row" onClick={this.goToPost.bind(this, post["post_url"])}>
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
                        <div className="row">Replies: {post["post_count"]} </div>
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
                                <Input placeholder="Post your message" name="discourse_message" id="discourse_message"
                                       onChange={this.onChangeField}/>
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
                        device_reg_no={this.state.device_reg_no}
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
