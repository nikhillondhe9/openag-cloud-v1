#!/usr/bin/env python3

import os, time, json, argparse, logging
from google.cloud import pubsub


ServiceAccount = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
# validated in main


#------------------------------------------------------------------------------
# Returns an authorized API client by discovering the IoT API and creating
# a service object using the service account credentials JSON.
def getIoTclient(service_account_json):
    api_scopes = ['https://www.googleapis.com/auth/cloud-platform']
    api_version = 'v1'
    discovery_api = 'https://cloudiot.googleapis.com/$discovery/rest'
    service_name = 'cloudiotcore'

    credentials = service_account.Credentials.from_service_account_file(
            service_account_json)
    scoped_credentials = credentials.with_scopes(api_scopes)

    discovery_url = '{}?version={}'.format(
            discovery_api, api_version)

    return discovery.build(
            service_name,
            api_version,
            discoveryServiceUrl=discovery_url,
            credentials=scoped_credentials)


#------------------------------------------------------------------------------
def main():

    # default log file and level
    logging.basicConfig( level=logging.ERROR ) # can only call once

    if None == ServiceAccount:
        logging.critical('Exiting. Missing GOOGLE_APPLICATION_CREDENTIALS '
			'environment variable.')
        exit( 1 )

    # make sure our env. vars are set up
    if None == os.getenv('GCLOUD_PROJECT') or None == os.getenv('GCLOUD_TOPIC'):
        logging.critical('publisher: Exiting. Missing GCLOUD env. vars.')
        exit( 1 )

    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--log', type=str, 
        help='log level: debug, info, warning, error, critical', 
        default='error' )
    args = parser.parse_args()

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % \
                args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )


    try:
		registry_name = 'projects/{}/locations/{}/registries/{}'.format(
            project_id, cloud_region, registry_id)

#debugrob
		client = getIoTclient( ServiceAccount )

    	with io.open(public_key_file) as f:
        	public_key = f.read()

    	# Note: You can have multiple credentials associated with a device.
    	device_template = {
        	'id': device_id,
        	'credentials': [{
            	'publicKey': {
                	'format': 'ES256_PEM',
                	'key': public_key
            	}
        	}]
    	}

    	devices = client.projects().locations().registries().devices()
    	devices.create(parent=registry_name, body=device_template).execute()

    except( Exception ) as e:
        logging.critical( "Exception", e )
    # end of main()


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




