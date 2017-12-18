#!/usr/bin/env python3

import os, time, json, argparse
from google.cloud import pubsub


#------------------------------------------------------------------------------
def main():

    # make sure our env. vars are set up
    if None == os.getenv('GCLOUD_PROJECT') or None == os.getenv('GCLOUD_TOPIC'):
        print('ERROR: Missing required environment variables.')
        exit( 1 )

    # parse command line args
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

    # build the DB row ID (should this be done on the server? YES!)
    # <expName>~<KEY>~<treatName>~<valName>~<created UTC TS> 
    ID = args.experiment + '~Env~' + \
         args.treatment + '~' + \
         args.variableName + '~' + \
         time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() )

    # create a python dict object
    message_obj = {}
    # dict entries must match the val table schema.
    message_obj['id'] = ID
    message_obj['type'] = 'float'
    message_obj['fval'] = str( args.value )
    message_json = json.dumps( message_obj ) # dict obj to JSON string

    # instantiate a client
    publisher = pubsub.PublisherClient()

    # the resource path for the topic 
    topic_path = publisher.topic_path( os.getenv('GCLOUD_PROJECT'), 
                                       os.getenv('GCLOUD_TOPIC') )

    # publish the message 
    try:
        future = publisher.publish( topic_path, message_json.encode('utf-8') )

        # result() blocks until future is complete 
        # (when message is ack'd by server)
        message_id = future.result()
        #print('\tfrom future, message_id: {}'.format(message_id))
    except Exception as e:
        print( "ERROR: Exception: %s" % e)
        exit( 1 )

    print('Published \'{}\' \n\tto: {}'.format(message_json, topic_path))


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




