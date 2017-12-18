#!/usr/bin/env python3

import os
import datetime
import base64
import json
#from google.cloud import pubsub # this does not have the pull() method
from google.cloud.gapic.pubsub.v1 import subscriber_client

#debugrob, will get error unless you have sourced the .bash file in here.

#------------------------------------------------------------------------------
def main():
    client = subscriber_client.SubscriberClient()
    # The resource path for the topic 
    subscription = client.subscription_path( os.environ['GCLOUD_PROJECT'], 
                                             os.environ['GCLOUD_SUBS'] )
    max_messages = 100

    print( 'Server running. Consuming telemetry events from', subscription)
    while True:
        #results = client.pull( subscription, max_messages, return_immediately=True )
        results = client.pull( subscription, max_messages )
        ack_ids = []

        print( 'Received {} messages:'.format( len( results.received_messages )))
        for rmessage in results.received_messages:
            ack_ids.append( rmessage.ack_id )
            print('\tmessage_id={}: data={}, '
                  '\n\t\tattributes={}, '
                  '\n\t\tpublish_time={}'.
                format( rmessage.message.message_id, 
                        rmessage.message.data, 
                        rmessage.message.attributes or 'None',
                        rmessage.message.publish_time ))

        # ACK all the messages we pulled.
        client.acknowledge( subscription, ack_ids )


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




