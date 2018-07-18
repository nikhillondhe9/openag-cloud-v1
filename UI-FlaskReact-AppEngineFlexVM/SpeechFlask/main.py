from flask import Flask, render_template
from flask_ask import Ask, statement, question
import base64
import json
import os
import random
import string
import sys
import time
import traceback
from datetime import datetime

import firebase_admin
import tweepy
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud import bigquery
from google.cloud import datastore
from google.cloud import storage
from google.oauth2 import service_account
from googleapiclient import discovery, errors

bigquery_client = bigquery.Client()

# Environment variables, set locally for testing and when deployed to gcloud.
path_to_google_service_account = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
cloud_project_id = os.environ['GCLOUD_PROJECT']
cloud_region = os.environ['GCLOUD_REGION']
device_registry = os.environ['GCLOUD_DEV_REG']
path_to_firebase_service_account = os.environ['FIREBASE_SERVICE_ACCOUNT']

# Datastore client for Google Cloud
datastore_client = datastore.Client(cloud_project_id)

# Storage client for Google Cloud
storage_client = storage.Client(cloud_project_id)

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
# Convert the UI display fields into a command set for the device.
# Returns a valid Jbrain recipe.
def convert_UI_recipe_to_commands(recipe_uuid, recipe_dict):
    try:
        recipe_json = json.dumps(recipe_dict)

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
# Create an entry in the Google IoT device registry.
# This is part of the device registration process that allows it to communicate
# with the backend.
def create_iot_device_registry_entry(verification_code, device_name,
                                     device_notes, device_type, user_uuid):
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
    docs = list(query.get())
    if not docs:
        print('create_iot_device_registry_entry: ERROR: '
              'Verification code "{}" not found.'.format(verification_code))
        raise ValueError('Verification code "{}" not found.'
                         .format(verification_code))

    # get the single matching doc
    doc = docs[0]
    key_dict = doc.to_dict()
    doc_id = doc.id

    # verify all the keys we need are in the doc's dict
    for key in ['key', 'cksum', 'state', 'MAC']:
        if key not in key_dict:
            print('create_iot_device_registry_entry: ERROR: '
                  'Missing {} in {}'.format(key, key_dict))
            raise ValueError('Device not registered properly.'
                             ' Please register again.')

    public_key = key_dict.get('key')
    cksum = key_dict.get('cksum')
    state = key_dict.get('state')
    MAC = key_dict.get('MAC')

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

    try:
        # add the device to the IoT registry
        devices = iot_client.projects().locations().registries().devices()
        devices.create(parent=registry_name, body=device_template).execute()
    except errors.HttpError as e:
        print('create_iot_device_registry_entry: ERROR: '
              'HttpError: {}'.format(e._get_reason()))
        raise

    print('create_iot_device_registry_entry: '
          'Device {} added to the {} registry.'.format(
        device_id, device_registry))

    # mark device state as verified
    # (can only call update on a DocumentReference)
    doc_ref = doc.reference
    doc_ref.update({u'state': u'verified'})

    return device_id  # put this id in the datastore of user's devices


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


def get_device_name(device_uuid):
    query = datastore_client.query(kind='Devices')
    query.add_filter('device_uuid', '=', device_uuid)
    results = list(query.fetch())
    if len(results) > 0:
        return results[0]["device_name"]
    else:
        return "Invalid device"


app = Flask(__name__)
ask = Ask(app, '/')


@ask.launch
def start_skill():
    welcome_message = 'Hello. Your basil is ready for harvest in 6 weeks.'
    return question(welcome_message)


@ask.intent('HelloIntent')
def hello():
    return statement("What are you doing manu")


@ask.intent("YesIntent")
def share_headlines():
    statement("Okay fetching your device status")
    return statement("Okay 2")


@ask.intent("TurnLightsBlue")
def turn_blue():
    device_id = "EDU-2B97073C-50-65-83-e7-9f-52"
    recipe_format = {
        "format": "openag-phased-environment-v1",
        "version": "2",
        "creation_timestamp_utc": "2018-06-29T19:14:58:02Z",
        "name": "Blue Spectrum - Basil",
        "uuid": "2fb92990-2980-4298-81f3-6d92c8e5b21e",
        "parent_recipe_uuid": "a4400436-9cfe-4437-8c25-ac68f6f225ba",
        "support_recipe_uuids": None,
        "description": {
            "brief": "There are many types of grow lights that can be used for growing basil. Eac",
            "verbose": "There are many types of grow lights that can be used for growing basil. Each type has its own characteristics and these should be considered before making a decision on which light system to use. The first point you must understand is that light is emitted in different wavelengths. By \u201cwavelengths\u201d I mean colors. If an object reflects all wavelengths of light it appears as white light to our eyes. Plants use different wavelengths of light during different phases of their life and for different purposes. One particular study on how light affects aroma and antioxidant content of sweet basil suggests that red light produces the largest leaves with the most moisture content. Yellow and green light produces leaves with the most phenolic compounds\u2013this is where you get antioxidants and essential oils from. Yellow and green also produces the most monoterpenoid and aliphatic compounds which give the herb its aroma as well as its anti-inflammatory medicinal properties.\n\nBlue light is often used for the beginning stages of growth and facilitates the vegetative growth of a plant. Red light is useful for flowering and fruit bearing. Since we don\u2019t really want our basil plant to flower, because it makes the leaves bitter, we are not too concerned with the red spectrum."
        },
        "authors": [
            {
                "name": "OpenAgTest",
                "uuid": "1e91ef7d-e9c2-4b0d-8904-f262a9eda70d",
                "email": "rp493@cornell.edu"
            }
        ],
        "cultivars": [
            {
                "name": "Basil/Sweet Basil",
                "uuid": "be1bdbb1-9cb3-4750-8384-967e1b5f22d9"
            }
        ],
        "cultivation_methods": [
            {
                "name": "Shallow Water Culture",
                "uuid": "7ede9b67-b55a-4eda-baac-1a252c98c5ba"
            }
        ],
        "environments": {
            "standard_day": {
                "name": "Standard Day",
                "light_spectrum_nm_percent": {
                    "400-449": 50.0,
                    "450-499": 50.0,
                    "500-549": 0.0,
                    "550-559": 0.0,
                    "600-649": 0.0,
                    "650-699": 0.0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 22
            },
            "standard_night": {
                "name": "Standard Night",
                "light_spectrum_nm_percent": {
                    "400-449": 50.0,
                    "450-499": 50.0,
                    "500-549": 0.0,
                    "550-559": 0.0,
                    "600-649": 0.0,
                    "650-699": 0.0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 22
            },
            "cold_day": {
                "name": "Cold Day",
                "light_spectrum_nm_percent": {
                    "400-449": 50.0,
                    "450-499": 50.0,
                    "500-549": 0.0,
                    "550-559": 0.0,
                    "600-649": 0.0,
                    "650-699": 0.0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 10
            },
            "frost_night": {
                "name": "Frost Night",
                "light_spectrum_nm_percent": {
                    "400-449": 50.0,
                    "450-499": 50.0,
                    "500-549": 0.0,
                    "550-559": 0.0,
                    "600-649": 0.0,
                    "650-699": 0.0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 2
            }
        },
        "phases": [
            {
                "name": "Standard Growth",
                "repeat": 29,
                "cycles": [
                    {
                        "name": "Day",
                        "environment": "standard_day",
                        "duration_hours": 23
                    },
                    {
                        "name": "Night",
                        "environment": "standard_night",
                        "duration_hours": 1
                    }
                ]
            },
            {
                "name": "Frosty Growth",
                "repeat": 1,
                "cycles": [
                    {
                        "name": "Day",
                        "environment": "cold_day",
                        "duration_hours": 18
                    },
                    {
                        "name": "Night",
                        "environment": "frost_night",
                        "duration_hours": 6
                    }
                ]
            }
        ]
    }
    current_recipe_uuid = "2fb92990-2980-4298-81f3-6d92c8e5b21e"
    commands_list = convert_UI_recipe_to_commands(current_recipe_uuid,
                                                  recipe_format)
    send_recipe_to_device_via_IoT(iot_client, device_id, commands_list)

    return statement("I told the backend to turn your lights to blue. It make take a few minutes")


@ask.intent("TurnLightsGreen")
def turn_green():
    device_id = "EDU-2B97073C-50-65-83-e7-9f-52"
    recipe_format = {
        "format": "openag-phased-environment-v1",
        "version": "2",
        "creation_timestamp_utc": "2018-06-29T19:01:52:20Z",
        "name": "Green Spectrum - Basil",
        "uuid": "e211f01d-9fee-470e-b8e1-23c49d165933",
        "parent_recipe_uuid": "60503a5f-b40f-460b-abc1-7326a57a172b",
        "support_recipe_uuids": None,
        "description": {
            "brief": "There are many types of grow lights that can be used for growing basil. Eac",
            "verbose": "There are many types of grow lights that can be used for growing basil. Each type has its own characteristics and these should be considered before making a decision on which light system to use. The first point you must understand is that light is emitted in different wavelengths. By \u201cwavelengths\u201d I mean colors. If an object reflects all wavelengths of light it appears as white light to our eyes. Plants use different wavelengths of light during different phases of their life and for different purposes. One particular study on how light affects aroma and antioxidant content of sweet basil suggests that red light produces the largest leaves with the most moisture content. Yellow and green light produces leaves with the most phenolic compounds\u2013this is where you get antioxidants and essential oils from. Yellow and green also produces the most monoterpenoid and aliphatic compounds which give the herb its aroma as well as its anti-inflammatory medicinal properties.\n\nBlue light is often used for the beginning stages of growth and facilitates the vegetative growth of a plant. Red light is useful for flowering and fruit bearing. Since we don\u2019t really want our basil plant to flower, because it makes the leaves bitter, we are not too concerned with the red spectrum."
        },
        "authors": [
            {
                "name": "OpenAgTest",
                "uuid": "1e91ef7d-e9c2-4b0d-8904-f262a9eda70d",
                "email": "rp493@cornell.edu"
            }
        ],
        "cultivars": [
            {
                "name": "Basil/Sweet Basil",
                "uuid": "d2ab254a-92ed-43e5-9789-8e3e34e1757f"
            }
        ],
        "cultivation_methods": [
            {
                "name": "Shallow Water Culture",
                "uuid": "81bb9cae-a2f0-4513-9358-c408ba4b8562"
            }
        ],
        "environments": {
            "standard_day": {
                "name": "Standard Day",

                "light_spectrum_nm_percent": {
                    "400-449": 0,
                    "450-499": 0,
                    "500-549": 50.0,
                    "550-559": 50.0,
                    "600-649": 0,
                    "650-699": 0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 22
            },
            "standard_night": {
                "name": "Standard Night",

                "light_spectrum_nm_percent": {
                    "400-449": 0,
                    "450-499": 0,
                    "500-549": 50.0,
                    "550-559": 50.0,
                    "600-649": 0,
                    "650-699": 0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 22
            },
            "cold_day": {
                "name": "Cold Day",

                "light_spectrum_nm_percent": {
                    "400-449": 0,
                    "450-499": 0,
                    "500-549": 50.0,
                    "550-559": 50.0,
                    "600-649": 0,
                    "650-699": 0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 10
            },
            "frost_night": {
                "name": "Frost Night",

                "light_spectrum_nm_percent": {
                    "400-449": 0,
                    "450-499": 0,
                    "500-549": 50.0,
                    "550-559": 50.0,
                    "600-649": 0,
                    "650-699": 0
                },
                "light_intensity_watts": 100,
                "light_illumination_distance_cm": 10,
                "air_temperature_celcius": 2
            }
        },
        "phases": [
            {
                "name": "Standard Growth",
                "repeat": 29,
                "cycles": [
                    {
                        "name": "Day",
                        "environment": "standard_day",
                        "duration_hours": 23
                    },
                    {
                        "name": "Night",
                        "environment": "standard_night",
                        "duration_hours": 1
                    }
                ]
            },
            {
                "name": "Frosty Growth",
                "repeat": 1,
                "cycles": [
                    {
                        "name": "Day",
                        "environment": "cold_day",
                        "duration_hours": 18
                    },
                    {
                        "name": "Night",
                        "environment": "frost_night",
                        "duration_hours": 6
                    }
                ]
            }
        ]
    }
    current_recipe_uuid = "2fb92990-2980-4298-81f3-6d92c8e5b21e"
    commands_list = convert_UI_recipe_to_commands(current_recipe_uuid,
                                                  recipe_format)
    send_recipe_to_device_via_IoT(iot_client, device_id, commands_list)

    return statement("Did you know blue and red spectrum is better for your basil? I told the backend to turn your lights to green. It make take a few minutes")


@ask.intent("StatusIntent")
def get_status():
    return statement(
        "The current temperature inside your food computer is 27 Celsius and Relative humidity is 40.0. Your carbon dioxide is 0.")
