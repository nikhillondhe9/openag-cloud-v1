#!/usr/bin/env python3

import os, time, json, argparse
from google.cloud import pubsub

GCLOUD_PROJECT = 'openag-cloud-v1'
GCLOUD_TOPIC = 'environmental-data'


#------------------------------------------------------------------------------
def main():
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

    # <expName>~<KEY>~<treatName>~<valName>~<created UTC TS> 
    ID = args.experiment + '~Env~' + \
         args.treatment + '~' + \
         args.variableName + '~' + \
         time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() )

    message_obj = {}
    # dict entries must match the val table schema.
    message_obj['id'] = ID
    message_obj['type'] = 'float'
    message_obj['fval'] = str( args.value )
    message_json = json.dumps( message_obj ) # dict obj to JSON string

    # Instantiates a client
    publisher = pubsub.PublisherClient()

    # The resource path for the topic 
    #topic_path = publisher.topic_path( os.environ['GCLOUD_PROJECT'], 
    #                                   os.environ['GCLOUD_TOPIC'] )
    topic_path = publisher.topic_path( GCLOUD_PROJECT, GCLOUD_TOPIC )

    # Publish a message 
    msg = message_json
    future = publisher.publish( topic_path, msg.encode('utf-8') )

    print('message \'{}\' \n\tsent to: {}'.format(msg, topic_path))

    # result() blocks until future is complete (when is that?)
    # after message is ack'd ?
    message_id = future.result()
    print('\tfrom future, message_id: {}'.format(message_id))


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




