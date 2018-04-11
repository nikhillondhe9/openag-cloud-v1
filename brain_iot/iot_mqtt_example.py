#!/usr/bin/env python3

"""Python sample for connecting to Google Cloud IoT Core via MQTT, using JWT.
This example connects to Google Cloud IoT Core via MQTT, using a JWT for device
authentication. After connecting, by default the device publishes messages
to the device's MQTT topic at a rate of one per second, and then exits.
"""

import argparse, datetime, os, random, ssl, time, logging, sys, signal, json
import jwt
import paho.mqtt.client as mqtt


# Handle the user pressing Control-C
def signal_handler(signal, frame):
    logging.critical( 'Exiting.' )
    sys.exit(0)
signal.signal( signal.SIGINT, signal_handler )


# The initial backoff time after a disconnection occurs, in seconds.
minimum_backoff_time = 1

# The maximum backoff time before giving up, in seconds.
MAXIMUM_BACKOFF_TIME = 32

# Whether to wait with exponential backoff before publishing.
should_backoff = False

# The last config message version we have seen (saved in config.json)
lastConfigVersion = 0
device_id = 0

# Default logging level, also used to turn on paho debugging
numeric_level = logging.ERROR 


#------------------------------------------------------------------------------
"""
Creates a JWT (https://jwt.io) to establish an MQTT connection.
  Args:
    project_id: The cloud project ID this device belongs to
    private_key_file: A path to a file containing either an RSA256 or
             ES256 private key.
    algorithm: The encryption algorithm to use. Either 'RS256' or 'ES256'
  Returns:
    An MQTT generated from the given project_id and private key, which
    expires in 20 minutes. After 20 minutes, your client will be
    disconnected, and a new JWT will have to be generated.
  Raises:
    ValueError: If the private_key_file does not contain a known key.
"""
def create_jwt( project_id, private_key_file, algorithm ):
    token = {
            # The time that the token was issued at
            'iat': datetime.datetime.utcnow(),
            # The time the token expires.
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            # The audience field should always be set to the GCP project id.
            'aud': project_id
    }

    # Read the private key file.
    with open(private_key_file, 'r') as f:
        private_key = f.read()

    print('Creating JWT using {} from private key file {}'.format(
            algorithm, private_key_file ))

    return jwt.encode(token, private_key, algorithm=algorithm)


#------------------------------------------------------------------------------
""" Convert a Paho error to a human readable string.  """
def error_str(rc):
    return '{}: {}'.format(rc, mqtt.error_string(rc))


#------------------------------------------------------------------------------
""" Callback for when a device connects.  """
def on_connect(unused_client, unused_userdata, unused_flags, rc):
    print('on_connect', mqtt.connack_string(rc))

    # After a successful connect, reset backoff time and stop backing off.
    global should_backoff
    global minimum_backoff_time
    should_backoff = False
    minimum_backoff_time = 1


#------------------------------------------------------------------------------
""" Paho callback for when a device disconnects.  """
def on_disconnect(unused_client, unused_userdata, rc):
    print('on_disconnect', error_str(rc))

    # Since a disconnect occurred, the next loop iteration will wait with
    # exponential backoff.
    global should_backoff
    should_backoff = True


#------------------------------------------------------------------------------
"""Paho callback when a message is sent to the broker."""
def on_publish(unused_client, unused_userdata, unused_mid):
    logging.debug( 'on_publish' )


#------------------------------------------------------------------------------
"""Callback when the device receives a message on a subscription."""
def on_message( unused_client, unused_userdata, message ):
    payload = message.payload.decode( 'utf-8' )
    # message is a paho.mqtt.client.MQTTMessage, these are all properties:
    print('Received message:\n  {}\n  topic={}\n  Qos={}\n  mid={}\n  '
        'retain={}'.format(
            payload, message.topic, str( message.qos ), str( message.mid ),
            str( message.retain ) ))

    # convert the payload to a dict and get the last config msg version
    messageVersion = 0 # starts before the first config version # of 1
    try:
        payloadDict = json.loads( payload )
        if 'lastConfigVersion' in payloadDict:
            messageVersion = int( payloadDict['lastConfigVersion'] )
    except Exception as e:
        logging.debug('Exception parsing payload: {}'.format(e))

    # The broker will keep sending config messages everytime we connect.
    # So compare this message (if a config message) to the last config
    # version we have seen.
    global lastConfigVersion 
    if messageVersion > lastConfigVersion:
        print('Handle the commands in the config message:\n{}\n'.format(
            payload ))
    else:
        print('Ignore this old config message.\n')

    # write our local config file, if this version is the highest we've seen.
    if messageVersion > lastConfigVersion:
        lastConfigVersion = messageVersion
        global device_id 
        config = { 'lastConfigVersion': lastConfigVersion,
                   'device_id': device_id }
        with open( 'config.json', 'w') as f:
            json.dump( config, f )



#------------------------------------------------------------------------------
def on_log( unused_client, unused_userdata, level, buf ):
    logging.debug('\'{}\' {}'.format(buf, level))


#------------------------------------------------------------------------------
def on_subscribe( unused_client, unused_userdata, mid, granted_qos ):
    logging.debug('on_subscribe')


#------------------------------------------------------------------------------
"""
Create our MQTT client. The client_id is a unique string that identifies
this device. For Google Cloud IoT Core, it must be in the format below.
"""
def get_client(
        project_id, cloud_region, registry_id, device_id, private_key_file,
        algorithm, ca_certs, mqtt_bridge_hostname, mqtt_bridge_port ):

    # projects/openag-v1/locations/us-central1/registries/device-registry/devices/my-python-device
    client_id=('projects/{}/locations/{}/registries/{}/devices/{}'.format(
        project_id, cloud_region, registry_id, device_id ))
    logging.debug('client_id={}'.format( client_id ))

    client = mqtt.Client( client_id=client_id )

    # With Google Cloud IoT Core, the username field is ignored, and the
    # password field is used to transmit a JWT to authorize the device.
    client.username_pw_set(
            username='unused',
            password=create_jwt(
                    project_id, private_key_file, algorithm))

    # Enable SSL/TLS support.
    client.tls_set( ca_certs=ca_certs, tls_version=ssl.PROTOCOL_TLSv1_2 )

    # Register message callbacks. https://eclipse.org/paho/clients/python/docs/
    # describes additional callbacks that Paho supports. In this example, the
    # callbacks just print to standard out.
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    client.on_subscribe = on_subscribe
    client.on_log = on_log 

    # Connect to the Google MQTT bridge.
    client.connect( mqtt_bridge_hostname, mqtt_bridge_port )

    # This is the topic that the device will receive COMMANDS on:
    mqtt_config_topic = '/devices/{}/config'.format( device_id )
    logging.debug('mqtt_config_topic={}'.format( mqtt_config_topic ))

    # Subscribe to the config topic.
    client.subscribe( mqtt_config_topic, qos=1 )

    return client


#------------------------------------------------------------------------------
def parse_command_line_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description=(
            'Example Google Cloud IoT Core MQTT device connection code.'))
    parser.add_argument(
            '--project_id',
            default=os.environ.get('GOOGLE_CLOUD_PROJECT'),
            help='GCP cloud project name')
    parser.add_argument(
            '--registry_id', required=True, help='Cloud IoT Core registry id')
    parser.add_argument(
            '--device_id', required=True, default=None,
            help='Cloud IoT Core device id')
    parser.add_argument(
            '--private_key_file',
            required=True, help='Path to private key file.')
    parser.add_argument(
            '--algorithm',
            choices=('RS256', 'ES256'),
            required=True,
            help='Which encryption algorithm to use to generate the JWT.')
    parser.add_argument(
            '--cloud_region', default='us-central1', help='GCP cloud region')
    parser.add_argument(
            '--ca_certs',
            default='roots.pem',
            help=('CA root from https://pki.google.com/roots.pem'))
    parser.add_argument(
            '--num_messages',
            type=int,
            default=100,
            help='Number of messages to publish.')
    parser.add_argument(
            '--message_type',
            choices=('event', 'state'),
            default='event',
            help=('Indicates whether the message to be published is a '
                  'telemetry event or a device state message.'))
    parser.add_argument(
            '--mqtt_bridge_hostname',
            default='mqtt.googleapis.com',
            help='MQTT bridge hostname.')
    parser.add_argument(
            '--mqtt_bridge_port',
            choices=(8883, 443),
            default=8883,
            type=int,
            help='MQTT bridge port.')
    parser.add_argument(
            '--jwt_expires_minutes',
            default=20,
            type=int,
            help=('Expiration time, in minutes, for JWT tokens.'))
    parser.add_argument( 
            '--log', 
            default='error',
            type=str, 
            help='Log level: debug, info, warning, error, critical' )

    return parser.parse_args()


#------------------------------------------------------------------------------
def main():
    # default log file and level
    logging.basicConfig( level=logging.ERROR ) # can only call once

    # read our local config file if it exists
    global lastConfigVersion 
    try:
        with open( 'config.json', 'r') as f:
            config = json.load( f )
        if 'lastConfigVersion' in config:
            lastConfigVersion = int( config['lastConfigVersion'] )
    except Exception as e:
        lastConfigVersion = 0

    # parse command line args
    args = parse_command_line_args()

    # user specified log level
    global numeric_level 
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )

    # validate our device_id
    if None == args.device_id or 0 == len( args.device_id ):
        logging.error( 'Invalid device_id on the command line.' )
        exit( 1 )
    global device_id 
    device_id = args.device_id

    # Publish to the events or state topic based on the flag.
    sub_topic = 'events' if args.message_type == 'event' else 'state'

    mqtt_topic = '/devices/{}/{}'.format( args.device_id, sub_topic )
    logging.debug('mqtt_topic={}'.format( mqtt_topic))

    jwt_iat = datetime.datetime.utcnow()
    jwt_exp_mins = args.jwt_expires_minutes
    client = get_client(
        args.project_id, args.cloud_region, args.registry_id, args.device_id,
        args.private_key_file, args.algorithm, args.ca_certs,
        args.mqtt_bridge_hostname, args.mqtt_bridge_port )

    # Turn on paho debugging if debug log enabled on command line.
    if numeric_level == logging.DEBUG:
        client.enable_logger() 

    # Publish num_messages mesages to the MQTT bridge once per second.
    for i in range(1, args.num_messages + 1):
        # Process network events.
        client.loop()

        # Wait if backoff is required.
        if should_backoff:
            # If backoff time is too large, give up.
            global minimum_backoff_time
            if minimum_backoff_time > MAXIMUM_BACKOFF_TIME:
                print('Exceeded maximum backoff time. Giving up.')
                break

            # Otherwise, wait and connect again.
            delay = minimum_backoff_time + random.randint(0, 1000) / 1000.0
            print('Waiting for {} before reconnecting.'.format(delay))
            time.sleep(delay)
            minimum_backoff_time *= 2
            client.connect(args.mqtt_bridge_hostname, args.mqtt_bridge_port)

        payload = '{}/{}-payload-{}'.format(
                args.registry_id, args.device_id, i)
        print('Publishing message {}/{}: \'{}\''.format(
                i, args.num_messages, payload))

        # [START iot_mqtt_jwt_refresh]
        seconds_since_issue = (datetime.datetime.utcnow() - jwt_iat).seconds
        if seconds_since_issue > 60 * jwt_exp_mins:
            print('Refreshing token after {}s').format(seconds_since_issue)
            jwt_iat = datetime.datetime.utcnow()
            client = get_client(
                args.project_id, args.cloud_region,
                args.registry_id, args.device_id, args.private_key_file,
                args.algorithm, args.ca_certs, args.mqtt_bridge_hostname,
                args.mqtt_bridge_port)
        # [END iot_mqtt_jwt_refresh]

        # Publish "payload" to the MQTT topic. qos=1 means at least once
        # delivery. Cloud IoT Core also supports qos=0 for at most once
        # delivery.
        client.publish( mqtt_topic, payload, qos=1 )

        # Send events every second. State should not be updated as often
        time.sleep( 1 if args.message_type == 'event' else 5 )

    # Blocking call that processes network traffic, dispatches callbacks and 
    # handles reconnecting.  This is a blocking form of the network loop and
    # will not return until the client calls disconnect(). 
    # It automatically handles reconnecting.
    # Other loop*() functions are available that give a threaded interface and
    # a manual interface.
    print('looping forever, use Ctrl-C to exit')
    client.loop_forever()

    print('Finished.')


#------------------------------------------------------------------------------
if __name__ == '__main__':
    main()
