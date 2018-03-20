#!/usr/bin/env python3

# Publish this devices public key as part of the registration / auth. process.

import argparse, sys, os, time, logging, traceback

#debugrob: change this to use mqtt IoT to publish.  see if it works if I delete the registered device.

#debugrob: CAN'T use pubsub, since it requires our privage GCP project key.
#from google.cloud import pubsub

#debugrob: copy code from other mqtt example, see if we can skip JWT?


#------------------------------------------------------------------------------
def parse_command_line_args():
    parser = argparse.ArgumentParser(description=(
            'Registration public key publisher.'))
    parser.add_argument(
            '--project_id',
            default=os.environ.get('GOOGLE_CLOUD_PROJECT'),
            help='GCP cloud project name')
    parser.add_argument(
            '--topic', required=True, help='Cloud pubsub topic.')
    parser.add_argument(
            '--public_key_file',
            required=True, help='Path to public key file.')
    parser.add_argument(
            '--public_key_hash',
            required=True, help='Sum of the public key.')
    parser.add_argument( '--log', type=str, 
        help='log level: debug, info, warning, error, critical', 
        default='error' )
    return parser.parse_args()


#------------------------------------------------------------------------------
def main():
    logging.basicConfig( level=logging.ERROR ) # can only call once

    args = parse_command_line_args()

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % \
                args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )

    # instantiate a google pubsub client
    publisher = pubsub.PublisherClient()

    # the resource path for the topic 
    topic_path = publisher.topic_path( args.project_id, args.topic )

    # read in the args.public_key_file
    with open( args.public_key_file, 'r' ) as f:
        key_file_contents = f.read()

    # create a python dict object, which will be serialized and published
    message_obj = {}
    message_obj['pkhash'] = args.pkhash
    message_obj['public_key'] = key_file_contents
    message_json = json.dumps( message_obj ) # dict obj to JSON string
    message_json = json.dumps( message_obj ) # dict obj to JSON string

    # publish the message 
    future = publisher.publish( topic_path, message_json.encode('utf-8') )

    # result() blocks until future is complete 
    # (when message is ack'd by server)
    message_id = future.result()
    logging.info('sent \'%s\' to %s' % (message_json, topic_path))


#------------------------------------------------------------------------------
if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception: %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


