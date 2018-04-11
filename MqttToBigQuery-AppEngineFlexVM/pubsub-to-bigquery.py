#!/usr/bin/env python3

""" This script reads data from a PubSub topic, 
    and stores it in BiqQuery using the BigQuery batch API.
"""

import base64, datetime, json, os, time, logging, sys, signal

import utils # local module

# Handle the user pressing Control-C
def signal_handler(signal, frame):
    logging.critical( 'Exiting.' )
    sys.exit(0)
signal.signal( signal.SIGINT, signal_handler )


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
    logging.info( "Using pubsub topic: %s" % PUBSUB_TOPIC )
    name = get_full_subscription_name(project_name, sub_name)
    body = {'topic': PUBSUB_TOPIC}
    subscription = ''
    # check if the subscription exists, if not, create it.
    try:
        subscription = client.projects().subscriptions().get(
            subscription=name ).execute( num_retries=NUM_RETRIES )
        logging.info( 'Subscription {} exists.'.format(subscription['name']))
    except Exception as e:
        # sub doesn't exist, so create it
        subscription = client.projects().subscriptions().create(
            name=name, body=body ).execute( num_retries=NUM_RETRIES )
        logging.info( 'Subscription {} was created.'.format(subscription['name']))


#------------------------------------------------------------------------------
# Returns a fully qualified subscription name.
def get_full_subscription_name(project, subscription):
    return fqrn('subscriptions', project, subscription)


#------------------------------------------------------------------------------
# Pulls messages from a given subscription.
def pull_messages(client, project_name, sub_name):
    BATCH_SIZE = 50
    values = []
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
        logging.critical( "Exception: %s" % e)
        time.sleep(0.5)
        return
    receivedMessages = resp.get('receivedMessages')
    if receivedMessages is not None:
        ack_ids = []
        for receivedMessage in receivedMessages:
                message = receivedMessage.get('message')
                if message:
                        values.append(
                            base64.urlsafe_b64decode(str(message.get('data'))))
                        ack_ids.append(receivedMessage.get('ackId'))
        ack_body = {'ackIds': ack_ids}
        client.projects().subscriptions().acknowledge(
                subscription=subscription, body=ack_body).execute(
                        num_retries=NUM_RETRIES)
    return values


#------------------------------------------------------------------------------
# Write the data to BigQuery in small chunks.
def write_to_bq( pubsub, sub_name, bigquery ):
    values = []
#debugrob: 
    #CHUNK = 50  # The size of the BigQuery insertion batch.
    CHUNK = 1
    # If no data on the subscription, the time to sleep in seconds
    # before checking again.
    WAIT = 2

    # run forever!
    while True:
        try:
            # accumulate values
            while len( values ) < CHUNK:
                msgs = pull_messages( pubsub, PROJECT_ID, sub_name )
                if msgs:
                    for msg in msgs:
                        # Each value must be a JSON object that matches the 
                        # table schema.
                        logging.info( 'received pubsub message data %s' % msg)
                        val = None
                        try:
                            val = json.loads( msg ) # JSON str to py dict
                        except Exception as e:
                            logging.critical( e )
                            continue
                        values.append( val )
                else:
                    # pause before checking again
                    logging.info( 'sleeping...')
                    time.sleep(WAIT)

            # data validation and insertion into the DB
            response = utils.bq_data_insert( bigquery, PROJECT_ID, values )

            values = [] # reset the values list

        except Exception as e:
            logging.critical( "write_to_bq: Exception: %s" % e)



#------------------------------------------------------------------------------
if __name__ == '__main__':
    logging.basicConfig( level=logging.INFO ) # can only call once
    topic_info = PUBSUB_TOPIC.split('/')
    topic_name = topic_info[-1]
    sub_name = "values-%s" % topic_name
    logging.info( "Subscribing and writing to BigQuery...")
    credentials = utils.get_credentials()
    bigquery = utils.create_bigquery_client(credentials)
    pubsub = utils.create_pubsub_client(credentials)
    try:
        subscription = create_subscription(pubsub, PROJECT_ID, sub_name)
    except Exception as e:
        logging.critical( e )
    # this func loops forever
    write_to_bq( pubsub, sub_name, bigquery )
    logging.critical( 'exited main loop' )


