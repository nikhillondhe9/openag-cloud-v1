#!/usr/bin/env python3

# This test script writes on-device brain commands to our PubSub service.

import base64, datetime, json, os, time, argparse, traceback

# our local function lib
import utils

# hard coded project and topic.
PROJECT_ID = 'openag-cloud-v1'
PUBSUB_TOPIC = 'projects/openag-cloud-v1/topics/commands'
NUM_RETRIES = 3


#------------------------------------------------------------------------------
if __name__ == '__main__':

    # command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--command', type=str, help='Command name',
                         default='Status')
    parser.add_argument( '--arg0', type=str, help='arg0',
                         default='0')
    parser.add_argument( '--arg1', type=str, help='arg1',
                         default='0')
    args = parser.parse_args()

    print( "Pubishing to %s" % PUBSUB_TOPIC )
    credentials = utils.get_credentials()
    pubsub = utils.create_pubsub_client( credentials )

    message_obj = {} # a python dict
    message_obj['command'] = str( args.command )
    message_obj['arg0'] = str( args.arg0 )
    message_obj['arg1'] = str( args.arg1 )
    message_json = json.dumps( message_obj ) # dict to JSON string
    print('publishing msg >', message_json, '<')

    # encode string as bytes, then B64 encode it (still bytes), then back 
    # to a string.
    b64 = base64.b64encode( message_json.encode('utf-8') ).decode()
    body = {'messages': [{'data': b64}]}

    try:
        resp = pubsub.projects().topics().publish(
                topic=PUBSUB_TOPIC, body=body).execute(
                        num_retries=NUM_RETRIES)
    except( Exception ) as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        print( "Exception: %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


