import json
import os
import sys
import traceback
from datetime import datetime

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore
from google.oauth2 import service_account
from googleapiclient import discovery

# Environment variables, set locally for testing and when deployed to gcloud.
path_to_google_service_account = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
cloud_project_id = os.environ['GCLOUD_PROJECT']
cloud_region = os.environ['GCLOUD_REGION']
device_registry = os.environ['GCLOUD_DEV_REG']
path_to_firebase_service_account = os.environ['FIREBASE_SERVICE_ACCOUNT']




# Datastore client for Google Cloud
datastore_client = datastore.Client(cloud_project_id)

consumer_key = os.environ['consumer_key']
consumer_secret = os.environ['consumer_secret']
access_token = os.environ['access_token']
access_secret = os.environ['access_secret']


register_device_blueprint = Blueprint('register_device_blueprint',__name__)



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

# Get an IoT client using the GCP project (NOT firebase proj!)
iot_client = get_IoT_client( path_to_google_service_account )


#------------------------------------------------------------------------------
# Returns an authorized API client by discovering the IoT API
# using the service account credentials JSON.
def get_firebase_client( fb_service_account_json ):
    cred = credentials.Certificate( fb_service_account_json )
    firebase_admin.initialize_app( cred )
    return firestore.client()

# Get a firebase client using the firebase auth
fb_client = get_firebase_client( path_to_firebase_service_account )


#------------------------------------------------------------------------------
# Create an entry in the Google IoT device registry.
# This is part of the device registration process that allows it to communicate
# with the backend.
def create_iot_device_registry_entry( verification_code, device_name,
        device_notes, device_type, user_uuid ):
    try:
        # get a firestore DB collection of the RSA public keys uploaded by
        # a setup script on the device:
        keys_ref = fb_client.collection( u'devicePublicKeys' )

        #docs = keys_ref.get()  # get all docs
        #for doc in docs:
        #    key_id = doc.id
        #    keyd = doc.to_dict()
        #    print(u'doc.id={}, doc={}'.format( key_id, keyd ))
        #    key = keyd['key']
        #    cksum = keyd['cksum']
        #    state = keyd['state']
        #    print('key={}, cksum={}, state={}'.format(key,cksum,state))

        # query the collection for the users code
        query = keys_ref.where( u'cksum', u'==', verification_code )
        docs = query.get() # doc iterator
        docs_list = list( docs )
        len_docs = len( docs_list )
        if 0 == len_docs:
            print( 'create_iot_device_registry_entry: ERROR: ' +
                'Verification code {} not found.'.format( verification_code ))
            return None

        # get the single matching doc
        doc = docs_list[0]
        key_dict = doc.to_dict()
        doc_id = doc.id

        # verify all the keys we need are in the doc's dict
        if not validDictKey( key_dict, 'key' ) and \
               validDictKey( key_dict, 'cksum' ) and \
               validDictKey( key_dict, 'state' ) and \
               validDictKey( key_dict, 'MAC' ):
            print( 'create_iot_device_registry_entry: ERROR: ' +
                'Missing a required key in {}'.format( key_dict ))
            return None

        public_key = key_dict['key']
        cksum = key_dict['cksum']
        state = key_dict['state']
        MAC = key_dict['MAC']
        #print( 'doc_id={}, cksum={}, state={}, MAC={}'.format(
        #        doc_id, cksum, state, MAC ))
        #print('public_key:\n{}'.format( public_key ))

        # Generate a unique device id from code + MAC.
        # ID MUST start with a letter!
        # (test ID format in the IoT core console)
        # Start and end your ID with a lowercase letter or a number.
        # You can also include the following characters: + . % - _ ~
        device_id = '{}-{}-{}'.format( device_type, verification_code, MAC )

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
            cloud_project_id, cloud_region, device_registry )

        # add the device to the IoT registry
        devices = iot_client.projects().locations().registries().devices()
        devices.create( parent=registry_name, body=device_template ).execute()
        print( 'create_iot_device_registry_entry: ' +
            'Device {} added to the {} registry.'.format(
                device_id, device_registry ))

        # mark device state as verified
        # (can only call update on a DocumentReference)
        doc_ref = doc.reference
        doc_ref.update( {u'state': u'verified'} )

        return device_id # put this id in the datastore of user's devices

    except( Exception ) as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        print( "Exception in create_iot_device_registry_entry: ", e )
        traceback.print_tb( exc_traceback, file=sys.stdout )


#------------------------------------------------------------------------------
# api.update_status('Test status')
@register_device_blueprint.route('/api/register/', methods=['GET', 'POST'])
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
    device_uuid = create_iot_device_registry_entry( device_reg_no,
            device_name, device_notes, device_type, user_uuid )
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