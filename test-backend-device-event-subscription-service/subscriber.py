#!/usr/bin/env python3

import os, sys, time, json, argparse, traceback, tempfile, logging, signal
from google.cloud import pubsub


#------------------------------------------------------------------------------
# Handle the user pressing Control-C
def signal_handler(signal, frame):
    logging.critical( 'Exiting.' )
    sys.exit(0)
signal.signal( signal.SIGINT, signal_handler )


#------------------------------------------------------------------------------
# This callback is called for each message we receive.
# We acknowledge the message, then validate and act on it if valid.
def callback( msg ):
    try:
        msg.ack() # acknowledge to the server that we got the message
        #print( json.loads( msg.data.decode('utf-8') )) # make a dict 
        print( 'data={}\n  deviceId={}\n  subFolder={}\n  deviceNumId={}\n'.
            format( 
                msg.data, 
                msg.attributes['deviceId'],
                msg.attributes['subFolder'],
                msg.attributes['deviceNumId'] ))
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception in callback(): %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


#------------------------------------------------------------------------------
def main():

    # default log level
    logging.basicConfig( level=logging.ERROR ) # can only call once

    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--log', type=str, 
        help='log level: debug, info, warning, error, critical', 
        default='info' )
    args = parser.parse_args()

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % \
                args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )

    # make sure our env. vars are set up
    if None == os.getenv('GCLOUD_PROJECT') or None == os.getenv('GCLOUD_SUBS'):
        logging.critical('Missing required environment variables.')
        exit( 1 )

    # instantiate a client
    client = pubsub.SubscriberClient()

    # the resource path for the topic 
    subs_path = client.subscription_path( os.getenv('GCLOUD_PROJECT'), 
                                          os.getenv('GCLOUD_SUBS') )

    # subscribe for messages
    logging.info( 'Waiting for message sent to %s' % subs_path )

    # in case of subscription timeout, use a loop to resubscribe.
    while True:  
        try:
            subscription = client.subscribe( subs_path )
            future = subscription.open( callback )

            # result() blocks until future is complete 
            # (when message is ack'd by server)
            message_id = future.result()
            logging.debug('\tfrom future, message_id: {}'.format(message_id))

        except Exception as e:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            logging.critical( "Exception in main(): %s" % e)
            traceback.print_tb( exc_traceback, file=sys.stdout )


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




