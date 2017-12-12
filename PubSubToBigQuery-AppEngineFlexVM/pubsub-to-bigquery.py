#!/usr/bin/env python

""" This script reads data from a PubSub topic, 
    and stores it in BiqQuery using the BigQuery batch API.
"""

import base64
import datetime
import json
import os
import time

import utils

# Get environment variables that are set by the app.yaml file.
PROJECT_ID = os.environ['PROJECT_ID']
PUBSUB_TOPIC = os.environ['PUBSUB_TOPIC']
NUM_RETRIES = 3


#------------------------------------------------------------------------------
# Returns a fully qualified resource name for Cloud Pub/Sub.
def fqrn(resource_type, project, resource):
    return "projects/{}/{}/{}".format(project, resource_type, resource)


#------------------------------------------------------------------------------
# Creates a new subscription to a given topic.
# Handles subscriptions that already exist.
def create_subscription(client, project_name, sub_name):
    print( "Using pubsub topic: %s" % PUBSUB_TOPIC )
    name = get_full_subscription_name(project_name, sub_name)
    body = {'topic': PUBSUB_TOPIC}
    subscription = ''
    # check if the subscription exists, if not, create it.
    try:
        subscription = client.projects().subscriptions().get(
            subscription=name ).execute( num_retries=NUM_RETRIES )
    except Exception as e:
        # sub doesn't exist, so create it
        subscription = client.projects().subscriptions().create(
            name=name, body=body ).execute( num_retries=NUM_RETRIES )
    print( 'Subscription {} was created/verified.'.format(subscription['name']))


#------------------------------------------------------------------------------
# Returns a fully qualified subscription name.
def get_full_subscription_name(project, subscription):
    return fqrn('subscriptions', project, subscription)


#------------------------------------------------------------------------------
# Pulls messages from a given subscription.
def pull_messages(client, project_name, sub_name):
    BATCH_SIZE = 50
    tweets = []
    subscription = get_full_subscription_name(project_name, sub_name)
    body = {
            'returnImmediately': False,
            'maxMessages': BATCH_SIZE
    }
    try:
        resp = client.projects().subscriptions().pull(
                subscription=subscription, body=body).execute(
                        num_retries=NUM_RETRIES)
    except Exception as e:
        print( "Exception: %s" % e)
        time.sleep(0.5)
        return
    receivedMessages = resp.get('receivedMessages')
    if receivedMessages is not None:
        ack_ids = []
        for receivedMessage in receivedMessages:
                message = receivedMessage.get('message')
                if message:
                        tweets.append(
                            base64.urlsafe_b64decode(str(message.get('data'))))
                        ack_ids.append(receivedMessage.get('ackId'))
        ack_body = {'ackIds': ack_ids}
        client.projects().subscriptions().acknowledge(
                subscription=subscription, body=ack_body).execute(
                        num_retries=NUM_RETRIES)
    return tweets


def write_to_bq(pubsub, sub_name, bigquery):
    """Write the data to BigQuery in small chunks."""
    tweets = []
#debugrob: 
    #CHUNK = 50  # The size of the BigQuery insertion batch.
    CHUNK = 1
    # If no data on the subscription, the time to sleep in seconds
    # before checking again.
    WAIT = 2
    tweet = None
    mtweet = None
    count = 0
#debugrob: should this be while True ? so it runs forever?
    count_max = 50000
    while count < count_max:
        while len(tweets) < CHUNK:
            twmessages = pull_messages(pubsub, PROJECT_ID, sub_name)
            if twmessages:
                for res in twmessages:
                    print( 'debugrob received message data: ', res)
                    try:
                        tweet = json.loads(res)
                    except Exception as e:
                        print( 'ERROR:', e )
                    print( 'debugrob received message tweet: ', tweet)

#debugrob: 
                    # First do some massaging of the raw data
                    #mtweet = utils.cleanup(tweet)
                    # We only want to write tweets to BigQuery; we'll skip
                    # 'delete' and 'limit' information.
                    #if 'delete' in mtweet:
                    #    continue
                    #if 'limit' in mtweet:
                    #    continue

                    tweets.append(mtweet)
            else:
                # pause before checking again
                print( 'sleeping...')
                time.sleep(WAIT)
        response = utils.bq_data_insert( bigquery, PROJECT_ID, 
            os.environ['BQ_DATASET'], os.environ['BQ_TABLE'], tweets )
        tweets = []
        count += 1
#debugrob: 
        #if count % 25 == 0:
        print ("processing count: %s of %s at %s: %s" %
                   (count, count_max, datetime.datetime.now(), response))


#------------------------------------------------------------------------------
if __name__ == '__main__':
    topic_info = PUBSUB_TOPIC.split('/')
    topic_name = topic_info[-1]
    sub_name = "tweets-%s" % topic_name
    print( "starting write to BigQuery....")
    credentials = utils.get_credentials()
    bigquery = utils.create_bigquery_client(credentials)
    pubsub = utils.create_pubsub_client(credentials)
    try:
        # TODO: check if subscription exists first
        subscription = create_subscription(pubsub, PROJECT_ID, sub_name)
    except Exception as e:
        print( e )
    write_to_bq(pubsub, sub_name, bigquery)
    print( 'exited write loop' )


