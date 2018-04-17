#!/usr/bin/env python3

import os, time, json, argparse, logging, uuid, base64

from google.oauth2 import service_account
from googleapiclient import discovery

import firebase_admin
from firebase_admin import credentials


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
def main():

    # default log file and level
    logging.basicConfig( level=logging.ERROR ) # can only call once

    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--log', type=str, default='error',
            help='log level: debug, info, warning, error, critical' )

    # IoT options
    parser.add_argument( '--iot_project', required=True, type=str, 
            help='GCloud IoT project ID.' )
    parser.add_argument( '--iot_service_account', required=True, type=str, 
            help='GClouod IoT service account JSON file.' )
    parser.add_argument( '--region', required=True, type=str )
    parser.add_argument( '--registry', required=True, type=str )
    parser.add_argument( '--device_id', required=True, type=str )
    parser.add_argument( '--command_1', required=True, type=str )
    parser.add_argument( '--arg0_1', type=str, default='0' )
    parser.add_argument( '--arg1_1', type=str, default='0' )
    parser.add_argument( '--command_2', type=str, default=None )
    parser.add_argument( '--arg0_2', type=str, default=None )
    parser.add_argument( '--arg1_2', type=str, default=None )
    parser.add_argument( '--command_3', type=str, default=None )
    parser.add_argument( '--arg0_3', type=str, default=None )
    parser.add_argument( '--arg1_3', type=str, default=None )
    parser.add_argument( '--command_4', type=str, default=None )
    parser.add_argument( '--arg0_4', type=str, default=None )
    parser.add_argument( '--arg1_4', type=str, default=None )
    args = parser.parse_args()

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )

    try:
        print('device_id={}'.format( args.device_id ))

        # get an IoT client using the GCP project (NOT firebase proj!)
        iotClient = getIoTclient( args.iot_service_account )

        # print list of devices 
        reg_path = 'projects/{}/locations/{}/registries/{}'.format(
                args.iot_project, args.region, args.registry )
        devices = iotClient.projects().locations().registries().devices(
                ).list( parent=reg_path ).execute().get('devices', [])
        for device in devices:
            print('Device: {} : {}'.format(
                    device.get('numId'),
                    device.get('id')))

        # get the latest config version number (int) for this device
        device_path = \
            'projects/{}/locations/{}/registries/{}/devices/{}'.format(
                args.iot_project, args.region, args.registry, args.device_id )
        devices = iotClient.projects().locations().registries().devices()
        configs = devices.configVersions().list( name=device_path 
                ).execute().get( 'deviceConfigs', [] )

        latestVersion = 1 # the first / default version
        if 0 < len( configs ):
            latestVersion = configs[0].get('version')
            print('latest version: {}\n\tcloudUpdateTime: {}\n' \
                '\tbinaryData: {}'.format(
                    configs[0].get('version'),
                    configs[0].get('cloudUpdateTime'),
                    configs[0].get('binaryData') ))

        # print the list of configs
        #for config in configs:
        #    print('version: {}\n\tcloudUpdateTime: {}\n' \
        #        '\tbinaryData: {}'.format(
        #            config.get('version'),
        #            config.get('cloudUpdateTime'),
        #            config.get('binaryData') ))
        
# JSON commands array
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
        config['deviceId'] = str( args.device_id )

        cmd = {} 
        cmd['command'] = str( args.command_1 )
        cmd['arg0'] = str( args.arg0_1 )
        cmd['arg1'] = str( args.arg1_1 )

        # for first command: assign a new LIST containg the first command.
        config['commands'] = [cmd]

        # append other commands if given
        if None != args.command_2:
            cmd = {} 
            cmd['command'] = str( args.command_2 )
            cmd['arg0'] = str( args.arg0_2 )
            cmd['arg1'] = str( args.arg1_2 )
            config['commands'].append( cmd )
        if None != args.command_3:
            cmd = {} 
            cmd['command'] = str( args.command_3 )
            cmd['arg0'] = str( args.arg0_3 )
            cmd['arg1'] = str( args.arg1_3 )
            config['commands'].append( cmd )
        if None != args.command_4:
            cmd = {} 
            cmd['command'] = str( args.command_4 )
            cmd['arg0'] = str( args.arg0_4 )
            cmd['arg1'] = str( args.arg1_4 )
            config['commands'].append( cmd )

        config_json = json.dumps( config ) # dict to JSON string
        print('config payload: {}'.format( config_json ))

        config_body = {
            'versionToUpdate': version,
            'binaryData': base64.urlsafe_b64encode(
                config_json.encode('utf-8')).decode('ascii')
        }
        res = iotClient.projects().locations().registries().devices(
                ).modifyCloudToDeviceConfig(
                    name=device_path, body=config_body ).execute()
        print('config update result: {}'.format( res ))

    except( Exception ) as e:
        logging.critical( "Exception", e )
    # end of main()


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




