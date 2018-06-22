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
# Return a new recipe, in the format expected by the Jbrain.
def make_recipe(recipe_uuid, \
                dayFR, dayR, dayB, dayG, dayCW, dayWW, \
                day_intensity, day_temp, \
                nightFR, nightR, nightB, nightG, nightCW, nightWW, \
                night_intensity, night_temp, \
                day_hours, night_hours,recipe_json):
    # make sure we have a valid recipe uuid
    if None == recipe_uuid or 0 == len(recipe_uuid):
        print("Error in make_recipe, missing recipe_uuid.")
        return ''

    recipe_template = recipe_json

    utc = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S:%f')[:-4] + 'Z'
    recipe = recipe_template

    # make it pretty json
    rdict = recipe
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
        led_panel_dac5578_off_far_red = 16.67
        led_panel_dac5578_off_red = 16.67
        led_panel_dac5578_off_warm_white = 16.67
        led_panel_dac5578_off_green = 16.67
        led_panel_dac5578_off_cool_white = 16.67
        led_panel_dac5578_off_blue =16.67
        led_panel_dac5578_on_far_red = 0
        led_panel_dac5578_on_red = 0
        led_panel_dac5578_on_warm_white = 0
        led_panel_dac5578_on_green = 0
        led_panel_dac5578_on_cool_white = 0
        led_panel_dac5578_on_blue = 0
        if validDictKey(recipe_dict, 'led_panel_dac5578_off_far_red'):
            led_panel_dac5578_off_far_red = recipe_dict['led_panel_dac5578_off_far_red']
        if validDictKey(recipe_dict, 'led_panel_dac5578_off_red'):
            led_panel_dac5578_off_red = recipe_dict['led_panel_dac5578_off_red']
        if validDictKey(recipe_dict, 'led_panel_dac5578_off_warm_white'):
            led_panel_dac5578_off_warm_white = recipe_dict['led_panel_dac5578_off_warm_white']
        if validDictKey(recipe_dict, 'led_panel_dac5578_off_green'):
            led_panel_dac5578_off_green = recipe_dict['led_panel_dac5578_off_green']
        if validDictKey(recipe_dict, 'led_panel_dac5578_off_cool_white'):
            led_panel_dac5578_off_cool_white = recipe_dict['led_panel_dac5578_off_cool_white']
        if validDictKey(recipe_dict, 'led_panel_dac5578_off_blue'):
            led_panel_dac5578_off_blue = recipe_dict['led_panel_dac5578_off_blue']
        if validDictKey(recipe_dict, 'led_panel_dac5578_on_far_red'):
            led_panel_dac5578_on_far_red = recipe_dict['led_panel_dac5578_on_far_red']
        if validDictKey(recipe_dict, 'led_panel_dac5578_on_red'):
            led_panel_dac5578_on_red = recipe_dict['led_panel_dac5578_on_red']
        if validDictKey(recipe_dict, 'led_panel_dac5578_on_warm_white'):
            led_panel_dac5578_on_warm_white = recipe_dict['led_panel_dac5578_on_warm_white']
        if validDictKey(recipe_dict, 'led_panel_dac5578_on_green'):
            led_panel_dac5578_on_green = recipe_dict['led_panel_dac5578_on_green']
        if validDictKey(recipe_dict, 'led_panel_dac5578_on_cool_white'):
            led_panel_dac5578_on_cool_white = recipe_dict['led_panel_dac5578_on_cool_white']
        if validDictKey(recipe_dict, 'led_panel_dac5578_on_blue'):
            led_panel_dac5578_on_blue = recipe_dict['led_panel_dac5578_on_blue']

        dayFR = convert_LED_value(led_panel_dac5578_on_far_red)
        dayR = convert_LED_value(led_panel_dac5578_on_red)
        dayB = convert_LED_value(led_panel_dac5578_on_blue)
        dayG = convert_LED_value(led_panel_dac5578_on_green)
        dayCW = convert_LED_value(led_panel_dac5578_on_cool_white)
        dayWW = convert_LED_value(led_panel_dac5578_on_warm_white)
        nightFR = convert_LED_value(led_panel_dac5578_off_far_red)
        nightR = convert_LED_value(led_panel_dac5578_off_red)
        nightB = convert_LED_value(led_panel_dac5578_off_blue)
        nightG = convert_LED_value(led_panel_dac5578_off_green)
        nightCW = convert_LED_value(led_panel_dac5578_off_cool_white)
        nightWW = convert_LED_value(led_panel_dac5578_off_warm_white)
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
                                  day_hours, night_hours,recipe_json=recipe_dict)

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
