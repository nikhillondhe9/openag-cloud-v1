#!/usr/bin/env python

# This test script writes an OpenAg environmental value to our PubSub service.

import base64
import datetime
import json
import os
import time
import argparse

# our local function lib
import utils

# hard coded topic.
PROJECT = os.getenv('GCLOUD_PROJECT') 
if None == PROJECT:
    print('ERROR: Missing required environment variables.')
    exit( 1 )

PUBSUB_TOPIC = 'projects/' + PROJECT + '/topics/environmental-data'

NUM_RETRIES = 3


#------------------------------------------------------------------------------
if __name__ == '__main__':

    # command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--experiment', type=str, help='Experiment name',
                         default='TestExp')
    parser.add_argument( '--treatment', type=str, help='Treatment name',
                         default='TestTreat')
    parser.add_argument( '--variableName', type=str, help='Env var name',
                         default='CO2')
    parser.add_argument( '--value', type=float, help='Value of env var',
                         required=True )
    args = parser.parse_args()

    # clean args, can't have any ~
    args.experiment = args.experiment.replace( '~', '' )
    args.treatment = args.treatment.replace( '~', '' )
    args.variableName = args.variableName.replace( '~', '' )

    print( "Pubishing to %s" % PUBSUB_TOPIC )
    credentials = utils.get_credentials()
    pubsub = utils.create_pubsub_client( credentials )

    # <expName>~<KEY>~<treatName>~<valName>~<created UTC TS> 
    ID = args.experiment + '~Env~' + \
         args.treatment + '~' + \
         args.variableName + '~' + \
         str( time.time() ).split('.')[0]

    message_obj = {}
    # dict entries must match the val table schema.
    message_obj['id'] = ID
    message_obj['type'] = 'float'
    message_obj['fval'] = str( args.value )
    message_json = json.dumps( message_obj ) # dict obj to JSON string
    print('publishing msg >', message_json, '<')

    # encode string as bytes, then B64 encode it (still bytes), then back 
    # to a string.
    b64 = base64.b64encode( message_json.encode('utf-8') ).decode()
    body = {'messages': [{'data': b64}]}

    try:
        resp = pubsub.projects().topics().publish(
                topic=PUBSUB_TOPIC, body=body).execute(
                        num_retries=NUM_RETRIES)
    except Exception as e:
        print( "Exception: %s" % e)

