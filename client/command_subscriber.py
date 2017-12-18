#!/usr/bin/env python3

import os, time, json
from google.cloud import pubsub

def callback(message):
    print(message.data)
    message.ack()

#------------------------------------------------------------------------------
def main():

    # make sure our env. vars are set up
    if None == os.getenv('GCLOUD_PROJECT') or None == os.getenv('GCLOUD_CMDS'):
        print('ERROR: Missing required environment variables.')
        exit( 1 )

    # instantiate a client
    client = pubsub.SubscriberClient()

    # the resource path for the topic 
    subs_path = client.subscription_path( os.getenv('GCLOUD_PROJECT'), 
                                          os.getenv('GCLOUD_CMDS') )

    # subscribe for messages
    try:
        subscription = client.subscribe( subs_path )
        future = subscription.open( callback )

        # result() blocks until future is complete 
        # (when message is ack'd by server)
        message_id = future.result()
        #print('\tfrom future, message_id: {}'.format(message_id))

    except Exception as e:
        print( "ERROR: Exception: %s" % e)
        exit( 1 )



#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




