import ast, base64, json, os, time, uuid, sys, traceback, random, string
from datetime import datetime, timedelta

import tweepy
from FCClass.user import User
from FCClass.user_session import UserSession
from flask import Flask, request, make_response
from flask import Response
from flask_cors import CORS

from google.cloud import bigquery
from google.cloud import datastore
from google.oauth2 import service_account
from googleapiclient import discovery

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from queries import queries

bigquery_client = bigquery.Client()

app = Flask(__name__)

# Environment variables, set locally for testing and when deployed to gcloud.
path_to_google_service_account = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
cloud_project_id = os.environ['GCLOUD_PROJECT']
cloud_region = os.environ['GCLOUD_REGION']
device_registry = os.environ['GCLOUD_DEV_REG']
path_to_firebase_service_account = os.environ['FIREBASE_SERVICE_ACCOUNT']

# Remove this later - Only use it for testing purposes. Not safe to leave it here
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)

# Datastore client for Google Cloud
datastore_client = datastore.Client(cloud_project_id)

consumer_key = os.environ['consumer_key']
consumer_secret = os.environ['consumer_secret']
access_token = os.environ['access_token']
access_secret = os.environ['access_secret']

# create an OAuthHandler instance
# Twitter requires all requests to use OAuth for authentication
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_secret)
# Construct the API instance
api = tweepy.API(auth)  # create an API object


# ------------------------------------------------------------------------------
# Returns an authorized API client by discovering the IoT API
# using the service account credentials JSON file.
def get_IoT_client(path_to_service_account_json):
    api_scopes = ['https://www.googleapis.com/auth/cloud-platform']
    api_version = 'v1'
    discovery_api = 'https://cloudiot.googleapis.com/$discovery/rest'
    service_name = 'cloudiotcore'

    creds = service_account.Credentials.from_service_account_file(
        path_to_service_account_json)
    scoped_credentials = creds.with_scopes(api_scopes)

    discovery_url = '{}?version={}'.format(
        discovery_api, api_version)

    return discovery.build(
        service_name,
        api_version,
        discoveryServiceUrl=discovery_url,
        credentials=scoped_credentials)


# Get an IoT client using the GCP project (NOT firebase proj!)
iot_client = get_IoT_client(path_to_google_service_account)


# ------------------------------------------------------------------------------
# Returns an authorized API client by discovering the IoT API
# using the service account credentials JSON.
def get_firebase_client(fb_service_account_json):
    cred = credentials.Certificate(fb_service_account_json)
    firebase_admin.initialize_app(cred)
    return firestore.client()


# Get a firebase client using the firebase auth
fb_client = get_firebase_client(path_to_firebase_service_account)


# ------------------------------------------------------------------------------
def id_generator(size=6, chars=string.digits):
    return ''.join(random.choice(chars) for x in range(size))


# ------------------------------------------------------------------------------
# Is the key is in the dict? if so return True.  if not False.
def validDictKey(d, key):
    if key in d:
        return True
    return False


# ------------------------------------------------------------------------------
# Return a new recipe, in the format expected by the Jbrain.
def make_recipe(recipe_uuid, \
                dayFR, dayR, dayB, dayG, dayCW, dayWW, \
                day_intensity, day_temp, \
                nightFR, nightR, nightB, nightG, nightCW, nightWW, \
                night_intensity, night_temp, \
                day_hours, night_hours):
    # make sure we have a valid recipe uuid
    if None == recipe_uuid or 0 == len(recipe_uuid):
        print("Error in make_recipe, missing recipe_uuid.")
        return ''

    recipe_template = '''{{
    "format": "openag-phased-environment-v1",
    "version": "1",
    "creation_timestamp_utc": "{creation_timestamp_utc}",
    "name": "simple recipe",
    "uuid": "{recipe_uuid}",
    "parent_recipe_uuid": null,
    "support_recipe_uuids": null,
    "description": {{
        "brief": "simple",
        "verbose": "simple"
    }},
    "authors": [
        {{
            "name": "Jake Rye",
            "email": "jrye@mit.edu",
            "uuid": "1"
        }}
    ],
    "cultivars": [
        {{
            "name": "plant",
            "uuid": "1"
        }}
    ],
    "cultivation_methods": [
        {{
            "name": "Shallow Water Culture",
            "uuid": "1"
        }}
    ],
    "environments": {{
        "standard_day": {{
            "name": "Standard Day",
            "light_spectrum_taurus": {{"FR": {dayFR}, "R": {dayR}, "B": {dayB}, "G": {dayG}, "CW": {dayCW}, "WW": {dayWW}}},
            "light_intensity_watts": {day_intensity},
            "light_illumination_distance_cm": 10,
            "air_temperature_celcius": {day_temp}
        }},
        "standard_night": {{
            "name": "Standard Night",
            "light_spectrum_taurus": {{"FR": {nightFR}, "R": {nightR}, "B": {nightB}, "G": {nightG}, "CW": {nightCW}, "WW": {nightWW}}},
            "light_intensity_watts": {night_intensity},
            "light_illumination_distance_cm": 10,
            "air_temperature_celcius": {night_temp}
        }}
    }},
    "phases": [
        {{
            "name": "Standard Growth",
            "repeat": 29,
            "cycles": [
                {{
                    "name": "Day",
                    "environment": "standard_day",
                    "duration_hours": {day_hours} 
                }},
                {{
                    "name": "Night",
                    "environment": "standard_night",
                    "duration_hours": {night_hours}
                }}
            ]
        }}
    ]
    }}'''

    utc = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S:%f')[:-4] + 'Z'
    recipe = recipe_template.format(creation_timestamp_utc=utc, \
                                    recipe_uuid=recipe_uuid, \
                                    dayFR=dayFR, dayR=dayR, dayB=dayB, dayG=dayG, \
                                    dayCW=dayCW, dayWW=dayWW, \
                                    day_intensity=day_intensity, day_temp=day_temp, \
                                    nightFR=nightFR, nightR=nightR, nightB=nightB, nightG=nightG, \
                                    nightCW=nightCW, nightWW=nightWW, \
                                    night_intensity=night_intensity, night_temp=night_temp, \
                                    day_hours=day_hours, night_hours=night_hours)

    # make it pretty json
    rdict = json.loads(recipe)
    recipe = json.dumps(rdict)
    return recipe


# ------------------------------------------------------------------------------
# debugrob: this is temporary, just until the UI writes the correct recipe format
# return a scaled int.
def convert_LED_value(led_str):
    led_i = int(led_str)
    return int(led_i / 2.55)


# ------------------------------------------------------------------------------
# Convert the UI display fields into a command set for the device.
# Returns a valid Jbrain recipe.
def convert_UI_recipe_to_commands(recipe_uuid, recipe_dict):
    try:
        # The 6 LED string vals are "0" to "255" (off)
        LED_panel_off_far_red = "255"  # off
        LED_panel_off_red = "255"
        LED_panel_off_warm_white = "255"
        LED_panel_off_green = "255"
        LED_panel_off_cool_white = "255"
        LED_panel_off_blue = "255"
        LED_panel_on_far_red = "0"  # full on
        LED_panel_on_red = "0"
        LED_panel_on_warm_white = "0"
        LED_panel_on_green = "0"
        LED_panel_on_cool_white = "0"
        LED_panel_on_blue = "0"
        if validDictKey(recipe_dict, 'LED_panel_off_far_red'):
            LED_panel_off_far_red = recipe_dict['LED_panel_off_far_red']
        if validDictKey(recipe_dict, 'LED_panel_off_red'):
            LED_panel_off_red = recipe_dict['LED_panel_off_red']
        if validDictKey(recipe_dict, 'LED_panel_off_warm_white'):
            LED_panel_off_warm_white = recipe_dict['LED_panel_off_warm_white']
        if validDictKey(recipe_dict, 'LED_panel_off_green'):
            LED_panel_off_green = recipe_dict['LED_panel_off_green']
        if validDictKey(recipe_dict, 'LED_panel_off_cool_white'):
            LED_panel_off_cool_white = recipe_dict['LED_panel_off_cool_white']
        if validDictKey(recipe_dict, 'LED_panel_off_blue'):
            LED_panel_off_blue = recipe_dict['LED_panel_off_blue']
        if validDictKey(recipe_dict, 'LED_panel_on_far_red'):
            LED_panel_on_far_red = recipe_dict['LED_panel_on_far_red']
        if validDictKey(recipe_dict, 'LED_panel_on_red'):
            LED_panel_on_red = recipe_dict['LED_panel_on_red']
        if validDictKey(recipe_dict, 'LED_panel_on_warm_white'):
            LED_panel_on_warm_white = recipe_dict['LED_panel_on_warm_white']
        if validDictKey(recipe_dict, 'LED_panel_on_green'):
            LED_panel_on_green = recipe_dict['LED_panel_on_green']
        if validDictKey(recipe_dict, 'LED_panel_on_cool_white'):
            LED_panel_on_cool_white = recipe_dict['LED_panel_on_cool_white']
        if validDictKey(recipe_dict, 'LED_panel_on_blue'):
            LED_panel_on_blue = recipe_dict['LED_panel_on_blue']

        dayFR = convert_LED_value(LED_panel_on_far_red)
        dayR = convert_LED_value(LED_panel_on_red)
        dayB = convert_LED_value(LED_panel_on_blue)
        dayG = convert_LED_value(LED_panel_on_green)
        dayCW = convert_LED_value(LED_panel_on_cool_white)
        dayWW = convert_LED_value(LED_panel_on_warm_white)
        nightFR = convert_LED_value(LED_panel_off_far_red)
        nightR = convert_LED_value(LED_panel_off_red)
        nightB = convert_LED_value(LED_panel_off_blue)
        nightG = convert_LED_value(LED_panel_off_green)
        nightCW = convert_LED_value(LED_panel_off_cool_white)
        nightWW = convert_LED_value(LED_panel_off_warm_white)
        # debugrob, defaults UI will have to fill in later
        day_intensity = 50
        night_intensity = 0
        day_temp = 22
        night_temp = 18
        day_hours = 18
        night_hours = (24 - day_hours)

        recipe_json = make_recipe(recipe_uuid, \
                                  dayFR, dayR, dayB, dayG, dayCW, dayWW, \
                                  day_intensity, day_temp, \
                                  nightFR, nightR, nightB, nightG, nightCW, nightWW, \
                                  night_intensity, night_temp, \
                                  day_hours, night_hours)

        # Currently we can only send a start or stop command.
        return_list = []
        cmd = {}
        cmd['command'] = 'START_RECIPE'
        cmd['arg0'] = recipe_json
        cmd['arg1'] = '0'
        return_list = [cmd]

        return return_list
    except(Exception) as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        print("Exception in convert_UI_recipe_to_commands: ", e)
        traceback.print_tb(exc_traceback, file=sys.stdout)


# ------------------------------------------------------------------------------
def send_recipe_to_device_via_IoT(iot_client, device_id, commands_list):
    # get the latest config version number (int) for this device
    device_path = \
        'projects/{}/locations/{}/registries/{}/devices/{}'.format(
            cloud_project_id, cloud_region, device_registry, device_id)
    devices = iot_client.projects().locations().registries().devices()
    configs = devices.configVersions().list(name=device_path
                                            ).execute().get('deviceConfigs', [])

    latestVersion = 1  # the first / default version
    if 0 < len(configs):
        latestVersion = configs[0].get('version')
        # print('send_recipe_to_device_via_IoT: Current config version: {}' \
        #    'Received on: {}\n'.format( latestVersion,
        #        configs[0].get('cloudUpdateTime')))

    # JSON commands array we send to the device
    # {
    #    "messageId": "<messageId>",   # number of seconds since epoch
    #    "deviceId": "<deviceId>",
    #    "commands": [
    #        {
    #            "command": "<command>",
    #            "arg0": "<arg0>",
    #            "arg1": "<arg1>"
    #        },
    #        {
    #            "command": "<command>",
    #            "arg0": "<arg0>",
    #            "arg1": "<arg1>"
    #        }
    #    ]
    # }

    # can only update the LATEST version!  (so get it first)
    version = latestVersion

    # send a config message to a device
    config = {}  # a python dict
    config['lastConfigVersion'] = str(version)
    config['messageId'] = str(int(time.time()))  # epoch seconds as message ID
    config['deviceId'] = str(device_id)
    config['commands'] = commands_list

    config_json = json.dumps(config)  # dict to JSON string
    print('send_recipe_to_device_via_IoT: Sending commands to device: {}' \
          .format(config_json))

    config_body = {
        'versionToUpdate': version,
        'binaryData': base64.urlsafe_b64encode(
            config_json.encode('utf-8')).decode('ascii')
    }
    res = iot_client.projects().locations().registries().devices(
    ).modifyCloudToDeviceConfig(
        name=device_path, body=config_body).execute()
    # print('config update result: {}'.format( res ))


# ------------------------------------------------------------------------------
# api.update_status('Test status')
@app.route('/api/register/', methods=['GET', 'POST'])
def register():
    received_form_response = json.loads(request.data.decode('utf-8'))

    user_token = received_form_response.get("user_token", None)
    device_name = received_form_response.get("device_name", None)
    device_reg_no = received_form_response.get("device_reg_no", None)
    device_notes = received_form_response.get("device_notes", None)
    device_type = received_form_response.get("device_type", None)
    time_stamp = datetime.now()

    if user_token is None or device_reg_no is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    if device_type is None:
        device_type = 'EDU'

    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Create a google IoT device registry entry for this device.
    # The method returns the device ID we need for IoT communications.
    device_uuid = create_iot_device_registry_entry(device_reg_no,
                                                   device_name, device_notes, device_type, user_uuid)
    if None == device_uuid:
        result = Response({"message": "Could not register this IoT device."},
                          status=500, mimetype='application/json')
        return result

    # Add the user to the users kind of entity
    key = datastore_client.key('Devices')
    # Indexes every other column except the description
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    device_reg_task.update({
        'device_uuid': device_uuid,
        'device_name': device_name,
        'device_reg_no': device_reg_no,
        'device_notes': device_notes,
        'user_uuid': user_uuid,
        'device_type': device_type,
        'registration_date': time_stamp
    })

    datastore_client.put(device_reg_task)

    if device_reg_task.key:
        data = json.dumps({
            "response_code": 200
        })
        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result


@app.route('/api/posttwitter/', methods=['GET', 'POST'])
def posttwitter():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_uuid = received_form_response.get("user_uuid", "Error")
    api.update_status('Food computer status for %s on %s' % (user_uuid, str(current_date)))
    data = {
        "message": "success"
    }
    result = Response(json.dumps(data), status=500, mimetype='application/json')
    return result


@app.route('/api/signup/', methods=['GET', 'POST'])
def signup():
    received_form_response = json.loads(request.data.decode('utf-8'))
    username = received_form_response.get("username", None)
    email_address = received_form_response.get("email_address", None)
    password = received_form_response.get("password", None)
    organization = received_form_response.get("organization", None)

    if username is None or email_address is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    user_uuid = User(username=username, password=password, email_address=email_address,
                     organization=organization).insert_into_db(datastore_client)

    if user_uuid:
        data = json.dumps({
            "response_code": 200
        })

        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result


@app.route('/login/', methods=['GET', 'POST'])
def login():
    received_form_response = json.loads(request.data.decode('utf-8'))

    username = received_form_response.get("username", None)
    password = received_form_response.get("password", None)

    if username is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    user_uuid = User(username=username, password=password).login_user(client=datastore_client)
    if user_uuid:
        session_token = UserSession(user_uuid=user_uuid).insert_into_db(client=datastore_client)
        data = json.dumps({
            "response_code": 200,
            "user_uuid": user_uuid,
            "user_token": session_token,
            "message": "Login Successful"
        })
        result = Response(data, status=200, mimetype='application/json')
    else:
        data = json.dumps({
            "response_code": 500,
            "message": "Login failed. Please check your credentials"
        })
        result = Response(data, status=500, mimetype='application/json')
    return result


def get_device_name(device_uuid):
    query = datastore_client.query(kind='Devices')
    query.add_filter('device_uuid', '=', device_uuid)
    results = list(query.fetch())
    if len(results) > 0:
        return results[0]["device_name"]
    else:
        return "Invalid device"


@app.route('/api/get_user_devices/', methods=['GET', 'POST'])
def get_user_devices():
    print("Fetching all the user devices")

    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    if user_token is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    query = datastore_client.query(kind='Devices')
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    query.add_filter('user_uuid', '=', user_uuid)
    query_result = list(query.fetch())

    results = list(query_result)

    results_array = []
    if len(results) > 0:
        for result_row in results:
            device_id = result_row.get("device_uuid", "")
            device_reg_no = result_row.get("device_reg_no", "")
            device_name = result_row.get("device_name", "")
            print('  {}, {}, {}'.format(
                device_id, device_reg_no, device_name))
            result_json = {
                'device_uuid': device_id,
                'device_notes': result_row.get("device_notes", ""),
                'device_type': result_row.get("device_type", ""),
                'device_reg_no': device_reg_no,
                'registration_date': result_row.get("registration_date", ""
                                                    ).strftime("%Y-%m-%d %H:%M:%S"),
                'user_uuid': result_row.get("user_uuid", ""),
                'device_name': device_name
            }
            results_array.append(result_json)

        data = json.dumps({
            "response_code": 200,
            "results": results_array
        })
        result = Response(data, status=200, mimetype='application/json')
        return result
    else:
        data = json.dumps({
            "response_code": 500,
            "results": results_array
        })
        result = Response(data, status=500, mimetype='application/json')
        return result


@app.route('/api/get_all_recipes/', methods=['GET', 'POST'])
def get_all_recipes():
    print("Fetching all the recipes")

    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Get the user devices and pass that information to the front end too
    query = datastore_client.query(kind='Devices')
    query.add_filter('user_uuid', '=', user_uuid)
    query_result = list(query.fetch())
    devices_results = list(query_result)

    devices = []
    if len(devices_results) > 0:
        for result_row in devices_results:
            device_json = {
                'device_uuid': result_row.get("device_uuid", ""),
                'device_notes': result_row.get("device_notes", ""),
                'device_type': result_row.get("device_type", ""),
                'device_reg_no': result_row.get("device_reg_no", ""),
                'registration_date': result_row.get("registration_date", "").strftime("%Y-%m-%d %H:%M:%S"),
                'user_uuid': result_row.get("user_uuid", ""),
                'device_name': result_row.get("device_name", "")
            }
            devices.append(device_json)

    # Get all recipes
    query = datastore_client.query(kind='Recipes')
    query_result = list(query.fetch())
    results = list(query_result)
    results_array = []
    if len(results) > 0:
        for result_row in results:
            result_json = {
                'recipe_name': result_row.get("recipe_name", ""),
                'recipe_plant': result_row.get("recipe_plant", ""),
                'recipe_json': result_row.get("recipe_json", {}),
                'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S"),
                'recipe_uuid': result_row.get("recipe_uuid", "")
            }
            results_array.append(result_json)

        data = json.dumps({
            "response_code": 200,
            "results": results_array,
            "devices": devices
        })
        result = Response(data, status=200, mimetype='application/json')
        return result
    else:
        data = json.dumps({
            "response_code": 500,
            "results": results_array,
            "devices": devices
        })
        result = Response(data, status=500, mimetype='application/json')
        return result


@app.route('/api/get_recipe_components/', methods=['GET', 'POST'])
def get_recipe_components():
    print("Fetching components related to a recipe")
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_uuid = str(received_form_response.get("recipe_id", '0'))

    components_array = []
    component_ids_array = []
    recipe_json = {}

    if recipe_uuid != '0':
        recipe_query = datastore_client.query(kind='Recipes')
        recipe_query.add_filter('recipe_uuid', '=', recipe_uuid)
        recipe_query_result = list(recipe_query.fetch())
        if len(recipe_query_result) == 1:
            component_ids = recipe_query_result[0]['components']
            recipe_json = recipe_query_result[0]['recipe_json']
            recipe_json = json.dumps(
                {k: v for k, v in json.loads(recipe_json).items() if k != 'components' or k != 'user_token'})
            for component_id in component_ids:
                component_ids_array.append(str(component_id))
                query = datastore_client.query(kind='Components')
                query.add_filter('component_id', '=', int(component_id))
                query_result = list(query.fetch())
                results = list(query_result)

                if len(results) > 0:
                    for result_row in results:
                        result_json = {
                            'component_key': result_row.get("component_key", ""),
                            'component_id': result_row.get("component_id", ""),
                            'component_description': result_row.get("component_description", ""),
                            'component_label': result_row.get("component_label", ""),
                            'component_type': result_row.get("component_type", ""),
                            'field_json': json.loads(result_row.get("field_json", {})),
                            'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                        }
                        components_array.append(result_json)
    else:
        for component_id in ["1", "2", "3"]:
            recipe_json = json.dumps({})
            component_ids_array.append(str(component_id))
            query = datastore_client.query(kind='Components')
            query.add_filter('component_id', '=', int(component_id))
            query_result = list(query.fetch())
            results = list(query_result)

            if len(results) > 0:
                for result_row in results:
                    result_json = {
                        'component_key': result_row.get("component_key", ""),
                        'component_id': result_row.get("component_id", ""),
                        'component_description': result_row.get("component_description", ""),
                        'component_label': result_row.get("component_label", ""),
                        'component_type': result_row.get("component_type", ""),
                        'field_json': json.loads(result_row.get("field_json", {})),
                        'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                    }
                    components_array.append(result_json)

    data = json.dumps({
        "response_code": 200,
        "results": components_array,
        'recipe_json': recipe_json,
        "component_ids_array": component_ids_array
    })
    result = Response(data, status=200, mimetype='application/json')
    return result


@app.route('/api/get_recipe_details/', methods=['GET', 'POST'])
def get_recipe_details():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_uuid = received_form_response.get("recipe_uuid", None)
    user_token = received_form_response.get("user_token", None)
    if recipe_uuid is None or user_token is None:
        return Response({"message": "Error occured"}, status=500, mimetype='application/json')

    query = datastore_client.query(kind='Recipes')
    query.add_filter('recipe_uuid', '=', recipe_uuid)

    # Get uuid's of all devices attached with this user
    all_user_devices = []
    device_query = datastore_client.query(kind='Devices')
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    device_query.add_filter('user_uuid', '=', user_uuid)
    devices_query_result = list(device_query.fetch())
    for result_row in list(devices_query_result):
        device_id = result_row.get("device_uuid", "")
        all_user_devices.append(device_id)

    # Recipe History - Somehow filter this in the context of the devices the user has registered with them
    recipe_history = {}
    recipe_history_query = datastore_client.query(kind="RecipeHistory")
    recipe_history_query.add_filter('recipe_uuid', '=', recipe_uuid)
    recipe_history_query.order = ['-updated_at']
    recipe_history_query_result = list(recipe_history_query.fetch())
    total_number_of_history_records = len(recipe_history_query_result)
    if total_number_of_history_records > 1:
        oldest_record = recipe_history_query_result[total_number_of_history_records - 1]
        for device in all_user_devices:
            recipe_history[device] = []

        for i in range(0, total_number_of_history_records - 1):
            print(oldest_record)
            history_result = recipe_history_query_result[i]
            if history_result["device_uuid"] in all_user_devices:
                device_uuid = history_result["device_uuid"]
                changes_in_record = (get_key_differences(ast.literal_eval(oldest_record["recipe_state"]),
                                                         ast.literal_eval(history_result["recipe_state"])))
                print(changes_in_record)
                recipe_history[device_uuid].append({
                    "updated_at": history_result.get("updated_at", "").strftime("%Y-%m-%d %H:%M:%S"),
                    "device_name": get_device_name(device_uuid),
                    "changes_in_record": changes_in_record
                })

    query_result = list(query.fetch())
    results = list(query_result)
    results_array = []
    if len(results) > 0:
        for result_row in results:
            components_array = []
            components = result_row.get("components", [])
            for component_id in components:
                component_query = datastore_client.query(kind='Components')
                component_query.add_filter('component_id', '=', int(component_id))
                query_result = list(component_query.fetch())
                component_results = list(query_result)

                if len(component_results) > 0:
                    for component_result_row in component_results:
                        result_json = {
                            'component_key': component_result_row.get("component_key", ""),
                            'component_id': component_result_row.get("component_id", ""),
                            'component_description': component_result_row.get("component_description", ""),
                            'component_label': component_result_row.get("component_label", ""),
                            'component_type': component_result_row.get("component_type", ""),
                            'field_json': json.loads(component_result_row.get("field_json", {})),
                            'modified_at': component_result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                        }
                        components_array.append(result_json)

            result_json = {
                'recipe_name': result_row.get("recipe_name", ""),
                'recipe_plant': result_row.get("recipe_plant", ""),
                'recipe_json': result_row.get("recipe_json", {}),
                'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S"),
                'recipe_uuid': result_row.get("recipe_uuid", ""),
                "components": components_array
            }
            results_array.append(result_json)

        data = json.dumps({
            "response_code": 200,
            "results": results_array,
            "history": recipe_history

        })
        result = Response(data, status=200, mimetype='application/json')
        return result


@app.route('/api/save_recipe/', methods=['GET', 'POST'])
def save_recipe():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_json = json.loads(received_form_response.get("recipe_json", None))
    recipe_name = recipe_json.get("recipe_name", None)
    recipe_plant = recipe_json.get("plant_type", None)
    recipe_json = recipe_json
    recipe_uuid = str(uuid.uuid4())
    created_from_uuid = recipe_json.get("template_recipe_uuid", None)
    modified_at = datetime.now()
    user_token = received_form_response.get("user_token", None)
    components = recipe_json.get("components", [])

    if user_token is None or recipe_json is None or recipe_name is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Add the user to the users kind of entity
    key = datastore_client.key('Recipes')
    # Indexes every other column except the description
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    device_reg_task.update({
        'recipe_name': recipe_name,
        'recipe_plant': recipe_plant,
        'recipe_json': json.dumps(recipe_json),
        'recipe_uuid': recipe_uuid,
        'user_uuid': user_uuid,
        'created_from_uuid': created_from_uuid,
        'modified_at': modified_at,
        'components': components
    })

    datastore_client.put(device_reg_task)

    if device_reg_task.key:
        data = json.dumps({
            "response_code": 200
        })
        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result


# ------------------------------------------------------------------------------
@app.route('/api/get_current_stats/', methods=['GET', 'POST'])
def get_current_stats():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_current_co2_value, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    result_json = {}
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            result_json["current_co2"] = "{0:.2f}".format(float(values[0]['value']))
    query_str = queries.formatQuery(
        queries.fetch_temp_results_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) > 0:
                result_json["current_temp"] = "{0:.2f}".format(float(values[0]['value']))
                if len(values) > 1:
                    result_json["current_rh"] = "{0:.2f}".format(float(values[1]['value']))

    data = json.dumps({
        "response_code": 200,
        "results": result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


# ------------------------------------------------------------------------------
@app.route('/api/get_co2_details/', methods=['GET', 'POST'])
def get_co2_details():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    past_day_date = (datetime.now() - timedelta(hours=24))
    current_date = datetime.utcnow()
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_co2_results_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    results = []
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            results.append({'value': values[0]['value'], 'time': row.eastern_time})

    data = json.dumps({
        "response_code": 200,
        "results": results
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


# ------------------------------------------------------------------------------
@app.route('/api/get_temp_details/', methods=['GET', 'POST'])
def get_temp_details():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_temp_results_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)

    query_result = query_job.result()
    humidity_array = []
    temp_array = []
    result_json = {
        'RH': humidity_array,
        'temp': temp_array
    }
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) > 0:
                result_json["temp"].append(
                    {'value': values[0]['value'], 'time': row.eastern_time})
                if len(values) > 1:
                    result_json["RH"].append(
                        {'value': values[1]['value'], 'time': row.eastern_time})

    data = json.dumps({
        "response_code": 200,
        "results": result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


# ------------------------------------------------------------------------------
@app.route('/api/get_led_panel/', methods=['GET', 'POST'])
def get_led_panel():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_led_panel_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    result_json = []
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) > 0:
                result_json.append({'cool_white': int(values[0]['value'].split(',')[0], 16),
                                    'warm_white': int(values[0]['value'].split(',')[1], 16),
                                    'blue': int(values[0]['value'].split(',')[2], 16),
                                    'green': int(values[0]['value'].split(',')[3], 16),
                                    'red': int(values[0]['value'].split(',')[4], 16),
                                    'far_red': int(values[0]['value'].split(',')[5], 16),
                                    'time': row.eastern_time})

    data = json.dumps({
        "response_code": 200,
        "results": result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


# ------------------------------------------------------------------------------
# Send the current recipe to the device.
def send_recipe_to_device(device_id, recipe_uuid):
    print('send_recipe_to_device: dev={} rec={}'.format(
        device_id, recipe_uuid))
    # Get the specified recipe
    query = datastore_client.query(kind='Recipes')
    query.add_filter('recipe_uuid', '=', recipe_uuid)
    query_result = list(query.fetch())
    results = list(query_result)
    recipe_json = {}  # empty dict
    if len(results) == 0:
        return
    # Process the result
    recipe_json = results[0].get("recipe_json", {})
    recipe_dict = json.loads(recipe_json)
    # UI components of a climate recipe into what the Jbrain expects
    commands_list = convert_UI_recipe_to_commands(recipe_uuid, recipe_dict)
    send_recipe_to_device_via_IoT(iot_client, device_id, commands_list)


# ------------------------------------------------------------------------------
# Save the device history.
@app.route('/api/apply_to_device/', methods=['GET', 'POST'])
def apply_to_device():
    received_form_response = json.loads(request.data.decode('utf-8'))

    device_uuid = received_form_response.get("device_uuid", None)
    recipe_uuid = received_form_response.get("recipe_uuid", None)
    user_token = received_form_response.get("user_token", None)
    date_applied = datetime.now()

    # Using the session token get the user_uuid associated with it
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())

    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # send the recipe to the device
    send_recipe_to_device(device_uuid, recipe_uuid)

    # Add the user to the users kind of entity
    key = datastore_client.key('DeviceHistory')

    # Indexes every other column except the description
    apply_to_device_task = datastore.Entity(key, exclude_from_indexes=[])

    if device_uuid is None or recipe_uuid is None or user_token is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    recipe_session_token = str(uuid.uuid4())
    apply_to_device_task.update({
        'recipe_session_token': recipe_session_token,
    # Used to track the recipe applied to the device and modifications made to it.
        'device_uuid': device_uuid,
        'recipe_uuid': recipe_uuid,
        'date_applied': date_applied,
        'date_expires': date_applied + timedelta(days=3000),
        'user_uuid': user_uuid
    })

    # Get the JSON for the current Recipe state
    recipe_query = datastore_client.query(kind='Recipes')
    recipe_query.add_filter('recipe_uuid', '=', recipe_uuid)
    recipe_query_result = list(recipe_query.fetch())

    recipe_json = {}
    if len(recipe_query_result) == 1:
        recipe_json = recipe_query_result[0]['recipe_json']

    # Add a new recipe history record to indicate an event for when you applied this recipe to this device
    key = datastore_client.key('RecipeHistory')
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])
    device_reg_task.update({
        "device_uuid": device_uuid,
        "recipe_uuid": recipe_uuid,
        "user_uuid": user_uuid,
        "recipe_session_token": str(uuid.uuid4()),
        "recipe_state": str(recipe_json),
        "updated_at": datetime.now()
    })

    datastore_client.put(device_reg_task)

    datastore_client.put(apply_to_device_task)
    if apply_to_device_task.key:
        data = json.dumps({
            "response_code": 200
        })

        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result


def get_key_differences(x, y):
    diff = False
    diff_json = {}
    diff_list = []
    for x_key in x:
        if x_key not in y:
            diff = True
            print("key %s in x, but not in y" % x_key)
        elif x[x_key] != y[x_key]:
            diff = True
            diff_json[x_key] = {
                "changed_from": x[x_key],
                "changed_to": y[x_key]
            }
            # print ("key %s in x and in y, but values differ (%s in x and %s in y)" % (x_key, x[x_key], y[x_key]))
            diff_list.append(
                ("key %s in x and in y, but values differ (%s in x and %s in y)" % (x_key, x[x_key], y[x_key])))
    if not diff:
        print("both files are identical")

    return diff_list


# ------------------------------------------------------------------------------
# Handle Change to a recipe running on a device
@app.route('/api/submit_recipe_change/', methods=['GET', 'POST'])
def submit_recipe_change():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_state = received_form_response.get("recipe_state", {})
    user_token = received_form_response.get("user_token", "")

    recipe_session_token = received_form_response.get("recipe_session_token", "")
    key = datastore_client.key('RecipeHistory')
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    # Get user uuid associated with this sesssion token
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())

    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Build a custom recipe dict from the dashboard values
    recipe_dict = {}
    recipe_state = json.loads(recipe_state)
    device_uuid = recipe_state.get("selected_device_uuid", "")
    recipe_dict['temp_humidity_sht25'] = str(recipe_state['sensor_temp'])
    recipe_dict['co2_t6713'] = str(recipe_state['sensor_co2'])
    led_on = recipe_state['led_on_data']
    recipe_dict['LED_panel_on_far_red'] = str(led_on['far_red'])
    recipe_dict['LED_panel_on_red'] = str(led_on['red'])
    recipe_dict['LED_panel_on_warm_white'] = str(led_on['warm_white'])
    recipe_dict['LED_panel_on_green'] = str(led_on['green'])
    recipe_dict['LED_panel_on_cool_white'] = str(led_on['cool_white'])
    recipe_dict['LED_panel_on_blue'] = str(led_on['blue'])
    led_off = recipe_state['led_off_data']
    recipe_dict['LED_panel_off_far_red'] = str(led_off['far_red'])
    recipe_dict['LED_panel_off_red'] = str(led_off['red'])
    recipe_dict['LED_panel_off_warm_white'] = str(led_off['warm_white'])
    recipe_dict['LED_panel_off_green'] = str(led_off['green'])
    recipe_dict['LED_panel_off_cool_white'] = str(led_off['cool_white'])
    recipe_dict['LED_panel_off_blue'] = str(led_off['blue'])

    current_recipe_uuid = ""
    recipe_session_token = ""
    # Get the recipe the device is currently running based on entry in the DeviceHisotry

    query_device_history = datastore_client.query(kind="DeviceHistory")
    query_device_history.add_filter('device_uuid', '=', device_uuid)
    query_device_history.order = ["-date_applied"]
    query_device_history_result = list(query_device_history.fetch())

    if len(query_device_history_result) >= 1:
        current_recipe_uuid = query_device_history_result[0]['recipe_uuid']
        recipe_session_token = query_device_history_result[0]['recipe_session_token']

    # make sure we have a valid recipe uuid
    if None == current_recipe_uuid or 0 == len(current_recipe_uuid):
        current_recipe_uuid = str(uuid.uuid4())

    device_reg_task.update({
        "device_uuid": device_uuid,
        "recipe_uuid": current_recipe_uuid,
        "user_uuid": user_uuid,
        "recipe_session_token": recipe_session_token,
        "recipe_state": str(recipe_dict),
        "updated_at": datetime.now()
    })

    datastore_client.put(device_reg_task)

    # convert the values in the dict into what the Jbrain expects
    commands_list = convert_UI_recipe_to_commands(current_recipe_uuid,
                                                  recipe_dict)
    send_recipe_to_device_via_IoT(iot_client, device_uuid, commands_list)

    data = json.dumps({
        "response_code": 200,
        "message": "Successfully applied"
    })
    return Response(data, status=200, mimetype='application/json')


@app.route('/api/verify_user_session/', methods=['GET', 'POST'])
def verify_user_session():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    is_expired = True
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)
        session_expiration = query_session_result[0].get("expiration_date", None)
        datenow = datetime.now()
        if session_expiration > datenow:
            is_expired = False

    data = json.dumps({
        "response_code": 200,
        "message": "Successful",
        "is_expired": is_expired
    })
    return Response(data, status=200, mimetype='application/json')


@app.route('/api/download_as_csv/', methods=['GET', 'POST'])
def download_as_csv():
    csv = 'foo,bar,baz\nhai,bai,crai\n'
    return Response(
        csv,
        mimetype="text/csv",
        headers={"Content-disposition":
                     "attachment; filename=myplot.csv"})


@app.route('/api/create_new_code/', methods=['GET', 'POST'])
def create_new_code():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())

    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    if user_uuid is None:
        result = Response({"message": "Invalid User: Unauthorized"}, status=500,
                          mimetype='application/json')
        return result

    generated_code = id_generator()
    # Add the user to the users kind of entity
    key = datastore_client.key('UserAccessCodes')
    # Indexes every other column except the description
    access_code_reg = datastore.Entity(key, exclude_from_indexes=[])

    access_code_reg.update({
        'user_uuid': user_uuid,
        'created_date': datetime.now(),
        'expiration_date': datetime.now() + timedelta(hours=24),
        'code': generated_code
    })

    datastore_client.put(access_code_reg)

    if access_code_reg.key:
        data = json.dumps({
            "response_code": 200,
            "code": generated_code
        })
        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result


# ------------------------------------------------------------------------------
# Create an entry in the Google IoT device registry.
# This is part of the device registration process that allows it to communicate
# with the backend.
def create_iot_device_registry_entry(verification_code, device_name,
                                     device_notes, device_type, user_uuid):
    try:
        # get a firestore DB collection of the RSA public keys uploaded by
        # a setup script on the device:
        keys_ref = fb_client.collection(u'devicePublicKeys')

        # docs = keys_ref.get()  # get all docs
        # for doc in docs:
        #    key_id = doc.id
        #    keyd = doc.to_dict()
        #    print(u'doc.id={}, doc={}'.format( key_id, keyd ))
        #    key = keyd['key']
        #    cksum = keyd['cksum']
        #    state = keyd['state']
        #    print('key={}, cksum={}, state={}'.format(key,cksum,state))

        # query the collection for the users code
        query = keys_ref.where(u'cksum', u'==', verification_code)
        docs = query.get()  # doc iterator
        docs_list = list(docs)
        len_docs = len(docs_list)
        if 0 == len_docs:
            print('create_iot_device_registry_entry: ERROR: ' +
                  'Verification code {} not found.'.format(verification_code))
            return None

        # get the single matching doc
        doc = docs_list[0]
        key_dict = doc.to_dict()
        doc_id = doc.id

        # verify all the keys we need are in the doc's dict
        if not validDictKey(key_dict, 'key') and \
                validDictKey(key_dict, 'cksum') and \
                validDictKey(key_dict, 'state') and \
                validDictKey(key_dict, 'MAC'):
            print('create_iot_device_registry_entry: ERROR: ' +
                  'Missing a required key in {}'.format(key_dict))
            return None

        public_key = key_dict['key']
        cksum = key_dict['cksum']
        state = key_dict['state']
        MAC = key_dict['MAC']
        # print( 'doc_id={}, cksum={}, state={}, MAC={}'.format(
        #        doc_id, cksum, state, MAC ))
        # print('public_key:\n{}'.format( public_key ))

        # Generate a unique device id from code + MAC.
        # ID MUST start with a letter!
        # (test ID format in the IoT core console)
        # Start and end your ID with a lowercase letter or a number.
        # You can also include the following characters: + . % - _ ~
        device_id = '{}-{}-{}'.format(device_type, verification_code, MAC)

        # register this device using its public key we got from the DB
        device_template = {
            'id': device_id,
            'credentials': [{
                'publicKey': {
                    'format': 'RSA_X509_PEM',
                    'key': public_key
                }
            }],
            'metadata': {
                'user_uuid': user_uuid,
                'device_name': device_name,
                'device_notes': device_notes
            }
        }

        # path to the device registry
        registry_name = 'projects/{}/locations/{}/registries/{}'.format(
            cloud_project_id, cloud_region, device_registry)

        # add the device to the IoT registry
        devices = iot_client.projects().locations().registries().devices()
        devices.create(parent=registry_name, body=device_template).execute()
        print('create_iot_device_registry_entry: ' +
              'Device {} added to the {} registry.'.format(
                  device_id, device_registry))

        # mark device state as verified
        # (can only call update on a DocumentReference)
        doc_ref = doc.reference
        doc_ref.update({u'state': u'verified'})

        return device_id  # put this id in the datastore of user's devices

    except(Exception) as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        print("Exception in create_iot_device_registry_entry: ", e)
        traceback.print_tb(exc_traceback, file=sys.stdout)


# ------------------------------------------------------------------------------
if __name__ == '__main__':
    # This is used when running locally. Gunicorn is used to run the
    # application on Google App Engine. See entrypoint in app.yaml.
    app.run(host='127.0.0.1', port=5000, debug=True)

