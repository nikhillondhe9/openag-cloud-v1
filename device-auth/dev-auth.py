#!/usr/bin/env python3

import os, time, json, argparse, logging

from google.oauth2 import service_account
from googleapiclient import discovery

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore


#------------------------------------------------------------------------------
# Returns an authorized API client by discovering the IoT API 
# using the service account credentials JSON.
def getIoTclient( service_account_json ):
    api_scopes = ['https://www.googleapis.com/auth/cloud-platform']
    api_version = 'v1'
    discovery_api = 'https://cloudiot.googleapis.com/$discovery/rest'
    service_name = 'cloudiotcore'

    creds = service_account.Credentials.from_service_account_file(
            service_account_json )
    scoped_credentials = creds.with_scopes( api_scopes )

    discovery_url = '{}?version={}'.format(
            discovery_api, api_version )

    return discovery.build(
            service_name,
            api_version,
            discoveryServiceUrl=discovery_url,
            credentials=scoped_credentials )


#------------------------------------------------------------------------------
# Returns an authorized API client by discovering the IoT API 
# using the service account credentials JSON.
def getFirestoreClient( service_account_json ):
    cred = credentials.Certificate( service_account_json )
    firebase_admin.initialize_app( cred )
    return firestore.client()


#------------------------------------------------------------------------------
def main():

    # default log file and level
    logging.basicConfig( level=logging.ERROR ) # can only call once


    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--log', type=str, default='error',
            help='log level: debug, info, warning, error, critical' )

    # firebase options
    parser.add_argument( '--fb_service_account', required=True, type=str, 
            help='FIREBASE service account JSON file.' )
    parser.add_argument( '--region', required=True, type=str, 
            help='FIREBASE region' )

    # IoT options
    parser.add_argument( '--iot_project', required=True, type=str, 
            help='GCloud IoT project ID.' )
    parser.add_argument( '--iot_service_account', required=True, type=str, 
            help='GClouod IoT service account JSON file.' )
    parser.add_argument( '--registry', required=True, type=str, 
            help='GCloud IoT device registry.' )
    parser.add_argument( '--device_id', required=True, type=str, 
            help='GCloud IoT device name in the registry.' )

    parser.add_argument( '--verification_code', required=True, type=str, 
            help='Device verification code from registration script.' )
    args = parser.parse_args()

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % \
                args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )


    try:
        # get a firestore DB client from the firebase project's private key
        db = getFirestoreClient( args.fb_service_account )
        keys_ref = db.collection( u'devicePublicKeys' )

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
        doc_ref = keys_ref.where( u'cksum', u'==', args.verification_code )
        docs = doc_ref.get()
        docs_list = list( docs )
        len_docs = len( docs_list )
        if 0 == len_docs:
            logging.error( 'Verification code {} not found.'.format( 
                args.verification_code ))
            exit( 1 )

        # get the single matching doc
        doc = docs_list[0]
        key_dict = doc.to_dict()
        doc_id = doc.id
        public_key = key_dict['key']
        cksum = key_dict['cksum']
        state = key_dict['state']
        print('doc_id={}, cksum={}, state={}'.format( doc_id, cksum, state ))
        print('public_key:\n{}'.format( public_key ))


        # register this device using its public key we got from the DB
        device_template = {
            'id': args.device_id,
            'credentials': [{
                'publicKey': {
                    'format': 'RSA_X509_PEM',
                    'key': public_key
                }
            }]
        }

        # path to the device registry
        registry_name = 'projects/{}/locations/{}/registries/{}'.format(
            args.iot_project, args.region, args.registry )

        # get an IoT client using the GCP project (NOT firebase proj!)
        iotClient = getIoTclient( args.iot_service_account )

        # add the device to the registry
        devices = iotClient.projects().locations().registries().devices()
        devices.create( parent=registry_name, body=device_template ).execute()
        print('Device {} added to the {} registry.'.format( 
            args.device_id, args.registry )

#debugrob:fix this!
        # mark device state as verified
        field_updates = collections.OrderedDict((
            ('state', 'verified')
        ))
        doc.update( field_updates )
        #doc.update( {u'state': u'verfied'} )

#debugrob: pass user id (email) as arg.  where are we storing user profile?
        # associate the device with a user

    except( Exception ) as e:
        logging.critical( "Exception", e )
    # end of main()


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




