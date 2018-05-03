import ast
import base64
import json
import os
import time
import uuid
from datetime import datetime, timedelta

import tweepy
from FCClass.user import User
from FCClass.user_session import UserSession
from flask import Flask, request
from flask import Response
from flask_cors import CORS
from google.cloud import bigquery
from google.cloud import datastore
from google.oauth2 import service_account
from googleapiclient import discovery

from queries import queries

bigquery_client = bigquery.Client()

app = Flask(__name__)


# Environment variables, set locally for testing and when deployed to gcloud.
path_to_google_service_account = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
cloud_project_id = os.environ['GCLOUD_PROJECT']
cloud_region = os.environ['GCLOUD_REGION']
device_registry = os.environ['GCLOUD_DEV_REG']

# Remove this later - Only use it for testing purposes. Not safe to leave it here
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)

# Datastore client for Google Cloud
datastore_client = datastore.Client(cloud_project_id)

consumer_key = os.environ['consumer_key']
consumer_secret = os.environ['consumer_secret']
access_token = os.environ['access_token']
access_secret = os.environ['access_secret']

#create an OAuthHandler instance
# Twitter requires all requests to use OAuth for authentication
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_secret)
# Construct the API instance
api = tweepy.API(auth) # create an API object


#------------------------------------------------------------------------------
# Returns an authorized API client by discovering the IoT API 
# using the service account credentials JSON file.
def get_IoT_client( path_to_service_account_json ):
    api_scopes = ['https://www.googleapis.com/auth/cloud-platform']
    api_version = 'v1'
    discovery_api = 'https://cloudiot.googleapis.com/$discovery/rest'
    service_name = 'cloudiotcore'

    creds = service_account.Credentials.from_service_account_file(
            path_to_service_account_json )
    scoped_credentials = creds.with_scopes( api_scopes )

    discovery_url = '{}?version={}'.format(
            discovery_api, api_version )

    return discovery.build(
            service_name,
            api_version,
            discoveryServiceUrl=discovery_url,
            credentials=scoped_credentials )


#------------------------------------------------------------------------------
# Get an IoT client using the GCP project (NOT firebase proj!)
iot_client = get_IoT_client( path_to_google_service_account )


#------------------------------------------------------------------------------
def validDictKey( d, key ):
    if key in d:
        return True
    else:
        return False


#------------------------------------------------------------------------------
# Convert the UI display fields into a command set for the device.
# Returns a list of commands.
def convert_UI_recipe_to_commands( recipe_dict ):
    try:
        # value is publish secs
        temp_humidity_sht25 = '60'
        if validDictKey( recipe_dict, 'temp_humidity_sht25' ):
            temp_humidity_sht25 = recipe_dict[ 'temp_humidity_sht25' ]
        temp_humidity_sht25 += '000' # convert secs to msecs

        co2_t6713 = '60'
        if validDictKey( recipe_dict, 'co2_t6713' ):
            co2_t6713 = recipe_dict[ 'co2_t6713' ]
        co2_t6713 += '000'

        # make a json schedule for the sensors
        temp_humidity_sht25_sched = \
            '{ "dtype": "4", "measurement_period_ms": "' + \
            temp_humidity_sht25 + \
            '", "num_cycles": "1", "cycles": [ { "num_steps": "1", "num_repeats": "28", "steps": [ { "set_point": "0", "duration": "86400" } ] } ] }'

        co2_t6713_sched = \
            '{ "dtype": "4", "measurement_period_ms": "' + \
            co2_t6713 + \
            '", "num_cycles": "1", "cycles": [ { "num_steps": "1", "num_repeats": "28", "steps": [ { "set_point": "0", "duration": "86400" } ] } ] }'

        # The 6 LED string vals are "0" to "255" (off) in the order below:
        LED_panel_off_far_red = "255"  # off
        LED_panel_off_red = "255"
        LED_panel_off_warm_white = "255"
        LED_panel_off_green = "255"
        LED_panel_off_cool_white = "255"
        LED_panel_off_blue = "255"
        LED_panel_on_far_red = "0" # full on
        LED_panel_on_red = "0"
        LED_panel_on_warm_white = "0"
        LED_panel_on_green = "0"
        LED_panel_on_cool_white = "0"
        LED_panel_on_blue = "0"
        if validDictKey( recipe_dict, 'LED_panel_off_far_red' ):
            LED_panel_off_far_red = recipe_dict[ 'LED_panel_off_far_red' ]
        if validDictKey( recipe_dict, 'LED_panel_off_red' ):
            LED_panel_off_red = recipe_dict[ 'LED_panel_off_red' ]
        if validDictKey( recipe_dict, 'LED_panel_off_warm_white' ):
            LED_panel_off_warm_white = recipe_dict[ 'LED_panel_off_warm_white' ]
        if validDictKey( recipe_dict, 'LED_panel_off_green' ):
            LED_panel_off_green = recipe_dict[ 'LED_panel_off_green' ]
        if validDictKey( recipe_dict, 'LED_panel_off_cool_white' ):
            LED_panel_off_cool_white = recipe_dict[ 'LED_panel_off_cool_white' ]
        if validDictKey( recipe_dict, 'LED_panel_off_blue' ):
            LED_panel_off_blue = recipe_dict[ 'LED_panel_off_blue' ]
        if validDictKey( recipe_dict, 'LED_panel_on_far_red' ):
            LED_panel_on_far_red = recipe_dict[ 'LED_panel_on_far_red' ]
        if validDictKey( recipe_dict, 'LED_panel_on_red' ):
            LED_panel_on_red = recipe_dict[ 'LED_panel_on_red' ]
        if validDictKey( recipe_dict, 'LED_panel_on_warm_white' ):
            LED_panel_on_warm_white = recipe_dict[ 'LED_panel_on_warm_white' ]
        if validDictKey( recipe_dict, 'LED_panel_on_green' ):
            LED_panel_on_green = recipe_dict[ 'LED_panel_on_green' ]
        if validDictKey( recipe_dict, 'LED_panel_on_cool_white' ):
            LED_panel_on_cool_white = recipe_dict[ 'LED_panel_on_cool_white' ]
        if validDictKey( recipe_dict, 'LED_panel_on_blue' ):
            LED_panel_on_blue = recipe_dict[ 'LED_panel_on_blue' ]

        # make a json schedule for the LED panel
        LEDs_on = '"{}","{}","{}","{}","{}","{}"'.format(
            LED_panel_on_far_red,
            LED_panel_on_red,
            LED_panel_on_warm_white,
            LED_panel_on_green,
            LED_panel_on_cool_white,
            LED_panel_on_blue )
        LEDs_off = '"{}","{}","{}","{}","{}","{}"'.format(
            LED_panel_off_far_red,
            LED_panel_off_red,
            LED_panel_off_warm_white,
            LED_panel_off_green,
            LED_panel_off_cool_white,
            LED_panel_off_blue )
        LED_panel_sched = '{ "dtype": "10", "measurement_period_ms": "60000", "num_cycles": "1", "cycles": [ { "num_steps": "2", "num_repeats": "28", "steps": [ { "set_point": [' + LEDs_on + '], "duration": "57600" }, { "set_point": [' + LEDs_off + '], "duration": "28800" } ] } ] }'

        # RESET is always the first command in the list:
        return_list = []
        cmd = {}
        cmd['command'] = 'RESET'
        cmd['arg0'] = '0'
        cmd['arg1'] = '0'
        return_list = [cmd]

        # Add commands for our two sensors to the list:
        cmd = {}
        cmd['command'] = 'LoadRecipeIntoVariable'
        cmd['arg0'] = 'co2_t6713'
        cmd['arg1'] = co2_t6713_sched
        return_list.append( cmd )
        cmd = {}
        cmd['command'] = 'AddVariableToTreatment'
        cmd['arg0'] = '0'
        cmd['arg1'] = 'co2_t6713'
        return_list.append( cmd )

        cmd = {}
        cmd['command'] = 'LoadRecipeIntoVariable'
        cmd['arg0'] = 'temp_humidity_sht25'
        cmd['arg1'] = temp_humidity_sht25_sched
        return_list.append( cmd )
        cmd = {}
        cmd['command'] = 'AddVariableToTreatment'
        cmd['arg0'] = '0'
        cmd['arg1'] = 'temp_humidity_sht25'
        return_list.append( cmd )

        cmd = {}
        cmd['command'] = 'LoadRecipeIntoVariable'
        cmd['arg0'] = 'LED_panel'
        cmd['arg1'] = LED_panel_sched
        return_list.append( cmd )
        cmd = {}
        cmd['command'] = 'AddVariableToTreatment'
        cmd['arg0'] = '0'
        cmd['arg1'] = 'LED_panel'
        return_list.append( cmd )

        # Last command in the list is to Run:
        cmd = {}
        cmd['command'] = 'RunTreatment'
        cmd['arg0'] = '0'
        cmd['arg1'] = '0'
        return_list.append( cmd )

        return return_list
    except( Exception ) as e:
        print( "Exception in convert_UI_recipe_to_commands", e )



#------------------------------------------------------------------------------
def send_recipe_to_device_via_IoT( iot_client, device_id, commands_list ):

    # get the latest config version number (int) for this device
    device_path = \
        'projects/{}/locations/{}/registries/{}/devices/{}'.format(
            cloud_project_id, cloud_region, device_registry, device_id )
    devices = iot_client.projects().locations().registries().devices()
    configs = devices.configVersions().list( name=device_path
            ).execute().get( 'deviceConfigs', [] )

    latestVersion = 1 # the first / default version
    if 0 < len( configs ):
        latestVersion = configs[0].get('version')
        #print('send_recipe_to_device_via_IoT: Current config version: {}' \
        #    'Received on: {}\n'.format( latestVersion,
        #        configs[0].get('cloudUpdateTime')))

    # JSON commands array we send to the device
    #{
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
    #}

    # can only update the LATEST version!  (so get it first)
    version = latestVersion

    # send a config message to a device
    config = {} # a python dict
    config['lastConfigVersion'] = str( version )
    config['messageId'] = str( int( time.time() )) # epoch seconds as message ID
    config['deviceId'] = str( device_id )
    config['commands'] = commands_list

    config_json = json.dumps( config ) # dict to JSON string
    print('send_recipe_to_device_via_IoT: Sending commands to device: {}' \
        .format( config_json ))

    config_body = {
        'versionToUpdate': version,
        'binaryData': base64.urlsafe_b64encode(
            config_json.encode('utf-8')).decode('ascii')
    }
    res = iot_client.projects().locations().registries().devices(
            ).modifyCloudToDeviceConfig(
                name=device_path, body=config_body ).execute()
    #print('config update result: {}'.format( res ))


#------------------------------------------------------------------------------
# api.update_status('Test status')
@app.route('/api/register/', methods=['GET', 'POST'])
def register():
    received_form_response = json.loads(request.data)

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

    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Add the user to the users kind of entity
    key = datastore_client.key('Devices')
    # Indexes every other column except the description
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    device_reg_task.update({
        'device_uuid': str(uuid.uuid4()),
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


@app.route('/api/posttwitter/',methods=['GET', 'POST'])
def posttwitter():
    received_form_response = json.loads(request.data)
    current_date = datetime.utcnow()
    user_uuid = received_form_response.get("user_uuid","Error")
    api.update_status('Food computer status for %s on %s'%(user_uuid,str(current_date)))
    data  = {
        "message":"success"
    }
    result = Response(json.dumps(data), status=500, mimetype='application/json')
    return result

@app.route('/api/signup/', methods=['GET', 'POST'])
def signup():
    received_form_response = json.loads(request.data)
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
    received_form_response = json.loads(request.data)

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


@app.route('/api/get_user_devices/', methods=['GET', 'POST'])
def get_user_devices():
    print("Fetching all the user devices")

    received_form_response = json.loads(request.data)
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
                device_id, device_reg_no, device_name ))
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

    received_form_response = json.loads(request.data)
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
    received_form_response = json.loads(request.data)
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

@app.route('/api/get_recipe_details/',methods=['GET', 'POST'])
def get_recipe_details():
    received_form_response = json.loads(request.data)
    recipe_uuid = received_form_response.get("recipe_uuid",None)
    if recipe_uuid is None:
        return Response({"message":"Error occured"}, status=500, mimetype='application/json')

    query = datastore_client.query(kind='Recipes')
    query.add_filter('recipe_uuid', '=', recipe_uuid)
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
                'recipe_plant':result_row.get("recipe_plant", ""),
                'recipe_json': result_row.get("recipe_json", {}),
                'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S"),
                'recipe_uuid': result_row.get("recipe_uuid", ""),
                "components":components_array
            }
            results_array.append(result_json)

        data = json.dumps({
            "response_code": 200,
            "results": results_array
        })
        result = Response(data, status=200, mimetype='application/json')
        return result
    
@app.route('/api/save_recipe/', methods=['GET', 'POST'])
def save_recipe():
    received_form_response = json.loads(request.data)
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


#------------------------------------------------------------------------------
@app.route('/api/get_current_stats/',methods=['GET', 'POST'])
def get_current_stats():
    received_form_response = json.loads(request.data)
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery( 
            queries.fetch_current_co2_value, device_uuid )

    query_job = bigquery_client.query( query_str, job_config=job_config)
    query_result = query_job.result()
    result_json = {}
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            result_json["current_co2"]= "{0:.2f}".format(float(values[0]['value']))
    query_str = queries.formatQuery( 
            queries.fetch_temp_results_history, device_uuid )

    query_job = bigquery_client.query( query_str, job_config=job_config)
    query_result = query_job.result()
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) >0 :
                result_json["current_temp"] = "{0:.2f}".format(float(values[0]['value']))
                if len(values) > 1:
                    result_json["current_rh"] =  "{0:.2f}".format(float(values[1]['value']))

    data = json.dumps({
        "response_code": 200,
        "results": result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


#------------------------------------------------------------------------------
@app.route('/api/get_co2_details/',methods=['GET', 'POST'])
def get_co2_details():
    received_form_response = json.loads(request.data)
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    past_day_date = (datetime.now() - timedelta(hours=24))
    current_date = datetime.utcnow()
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery( 
            queries.fetch_co2_results_history, device_uuid )

    query_job = bigquery_client.query( query_str, job_config=job_config)
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


#------------------------------------------------------------------------------
@app.route('/api/get_temp_details/', methods=['GET', 'POST'])
def get_temp_details():
    received_form_response = json.loads(request.data)
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery( 
            queries.fetch_temp_results_history, device_uuid )

    query_job = bigquery_client.query( query_str, job_config=job_config)

    query_result = query_job.result()
    humidity_array = []
    temp_array = []
    result_json = {
        'RH':humidity_array,
        'temp':temp_array
    }
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) > 0 :
                result_json["temp"].append(
                    {'value':values[0]['value'],'time':row.eastern_time})
                if len(values) > 1:
                    result_json["RH"].append(
                        {'value':values[1]['value'],'time':row.eastern_time})

    data = json.dumps({
        "response_code": 200,
        "results":result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


#------------------------------------------------------------------------------
@app.route('/api/get_led_panel/', methods=['GET', 'POST'])
def get_led_panel():
    received_form_response = json.loads(request.data)
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery( 
            queries.fetch_led_panel_history, device_uuid )

    query_job = bigquery_client.query( query_str, job_config=job_config)
    query_result = query_job.result()
    result_json = []
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) >0 :
                result_json.append({'cool_white':int(values[0]['value'].split(',')[0],16),
                                    'warm_white':int(values[0]['value'].split(',')[1],16),
                                    'blue':int(values[0]['value'].split(',')[2],16),
                                    'green':int(values[0]['value'].split(',')[3],16),
                                    'red':int(values[0]['value'].split(',')[4],16),
                                    'far_red':int(values[0]['value'].split(',')[5],16),
                                    'time':row.eastern_time})


    data = json.dumps({
        "response_code": 200,
        "results":result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


#------------------------------------------------------------------------------
# Send the current recipe to the device.
def send_recipe_to_device( device_id, recipe_uuid ):
    print('send_recipe_to_device: dev={} rec={}'.format(
        device_id, recipe_uuid ))
    # Get the specified recipe
    query = datastore_client.query( kind='Recipes' )
    query.add_filter( 'recipe_uuid', '=', recipe_uuid )
    query_result = list( query.fetch())
    results = list( query_result )
    recipe_json = {} # empty dict
    if len( results ) == 0:
        return
    # Process the result
    recipe_json = results[0].get( "recipe_json", {} )
    recipe_dict = json.loads( recipe_json )
    # UI components of a climate recipe into what the Cbrain expects
    commands_list = convert_UI_recipe_to_commands( recipe_dict )
    send_recipe_to_device_via_IoT( iot_client, device_id, commands_list )


#------------------------------------------------------------------------------
# Save the device history.
@app.route('/api/apply_to_device/', methods=['GET', 'POST'])
def apply_to_device():
    received_form_response = json.loads(request.data)

    device_uuid = received_form_response.get("device_uuid", None)
    recipe_uuid = received_form_response.get("recipe_uuid", None)
    user_token = received_form_response.get("user_token", None)
    date_applied = datetime.now()

    # send the recipe to the device
    send_recipe_to_device( device_uuid, recipe_uuid )

    # Add the user to the users kind of entity
    key = datastore_client.key('DeviceHistory')

    # Indexes every other column except the description
    apply_to_device_task = datastore.Entity(key, exclude_from_indexes=[])

    if device_uuid is None or recipe_uuid is None or user_token is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    apply_to_device_task.update({
        'recipe_session_token':str(uuid.uuid4()), #Used to track the recipe applied to the device and modifications made to it.
        'device_uuid': device_uuid,
        'recipe_uuid': recipe_uuid,
        'date_applied': date_applied,
        'date_expires': date_applied + timedelta(days=3000)
    })

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


#------------------------------------------------------------------------------
# Handle Change to a recipe running on a device
@app.route('/api/submit_recipe_change/', methods=['GET', 'POST'])
def submit_recipe_change():
    received_form_response = json.loads(request.data)
    recipe_state = received_form_response.get("recipe_state",{})
    device_uuid = received_form_response.get("device_uuid","")
    user_uuid = received_form_response.get("user_uuid","")
    recipe_session_token = received_form_response.get("recipe_session_token","")
    key = datastore_client.key('RecipeHistory')
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    # Build a custom recipe dict from the dashboard values
    recipe_dict = {}
    recipe_dict[ 'temp_humidity_sht25' ] = str( recipe_state['sensor_temp'] )
    recipe_dict[ 'co2_t6713' ] = str( recipe_state['sensor_co2'] )
    led_on = recipe_state['led_on_data']
    recipe_dict[ 'LED_panel_on_far_red' ] = str( led_on['far_red'] )
    recipe_dict[ 'LED_panel_on_red' ] = str( led_on['red'] )
    recipe_dict[ 'LED_panel_on_warm_white' ] = str( led_on['warm_white'] )
    recipe_dict[ 'LED_panel_on_green' ] = str( led_on['green'] )
    recipe_dict[ 'LED_panel_on_cool_white' ] = str( led_on['cool_white'] )
    recipe_dict[ 'LED_panel_on_blue' ] = str( led_on['blue'] )
    led_off = recipe_state['led_off_data']
    recipe_dict[ 'LED_panel_off_far_red' ] = str( led_off['far_red'] )
    recipe_dict[ 'LED_panel_off_red' ] = str( led_off['red'] )
    recipe_dict[ 'LED_panel_off_warm_white' ] = str( led_off['warm_white'] )
    recipe_dict[ 'LED_panel_off_green' ] = str( led_off['green'] )
    recipe_dict[ 'LED_panel_off_cool_white' ] = str( led_off['cool_white'] )
    recipe_dict[ 'LED_panel_off_blue' ] = str( led_off['blue'] )
    device_id = recipe_state['selected_device_uuid']
    device_reg_task.update({
        "device_uuid": device_uuid,
        "user_uuid": user_uuid,
        "recipe_session_token": recipe_session_token,
        "recipe_state":str(recipe_dict)
    })

    datastore_client.put(device_reg_task)
    # convert the values in the dict into what the Cbrain expects
    commands_list = convert_UI_recipe_to_commands( recipe_dict )
    send_recipe_to_device_via_IoT( iot_client, device_id, commands_list )

    return Response({}, status=200, mimetype='application/json')




