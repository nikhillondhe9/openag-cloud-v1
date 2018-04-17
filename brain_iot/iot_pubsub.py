#!/usr/bin/env python3

"""
On device app to:
  - Read data from a pipe and publish it to the Google Cloud IoT Core via 
    MQTT messages.  The C brain is writing the data to the pipe.

  - Subscribe for MQTT config messages which contain commands for the device
    to execute.  The config messages are published by the backend for this
    device.  The commands are written as binary structs to a pip that the 
    C brain reads.

JWT (json web tokens) are used for secure device authentication based on RSA
public/private keys. 

After connecting, this process:
 - reads data from a pipe (written by the C brain)
 - publishes data to a common (to all devices) MQTT topic.
 - subscribes for config messages for only this device specific MQTT topic.
 - writes commands to a pipe (read by the C brain)

rbaynes 2018-04-10
"""

#debugrob: Make sure to use the IOT requirements.txt instead of brain python pubsub setup script.


import argparse, datetime, os, ssl, time, logging, json
import sys, traceback, signal, select, tempfile
import jwt
import paho.mqtt.client as mqtt
from recipe_lib import Recipe # local library


# Handle the user pressing Control-C
def signal_handler(signal, frame):
    logging.critical( 'Exiting iot_pubsub.' )
    sys.exit(0)
signal.signal( signal.SIGINT, signal_handler )


# The last config message version we have seen (saved in config.json)
lastConfigVersion = 0
DeviceId = None

# Default logging level, also used to turn on paho debugging.
LogNumericLevel = logging.ERROR 

# Encryption algorithm to use for JWT (RSA 256 bit)
EncryptionAlgorithm = 'RS256' 

# globals used to hold our meta info about the running treatment, read from
# the data pipe
TREAT = {}
TREAT_ID = -1

# some constants for parsing received commands 
COMMANDS    = 'commands'
MESSAGEID   = 'messageId'
CMD         = 'command'
ARG0        = 'arg0'
ARG1        = 'arg1'
CMD_RUN     = 'runtreatment' 
CMD_STOP    = 'stoptreatment'
CMD_LOAD    = 'loadrecipeintovariable'
CMD_ADD     = 'addvariabletotreatment' 
CMD_EXIT    = 'exittreatments'
CMD_STATUS  = 'status'
CMD_NOOP    = 'noop'
CMD_RESET   = 'reset'

# dict of name to binary command ID 
# (for writing structs to the command pipe that the brain reads)
CMDS = {
    CMD_RUN   :1,
    CMD_STOP  :2,
    CMD_LOAD  :3,
    CMD_ADD   :4,
    CMD_EXIT  :5,
    CMD_STATUS:6,
    CMD_NOOP  :7,
    CMD_RESET :8 }

# globals used for pipe we write commands to (which the brain reads)
commandFIFO = 0
commandFIFO_fileName = None


#------------------------------------------------------------------------------
def writeChar( char ):
    char_bytes = char.encode( 'utf-8' )
    global commandFIFO
    commandFIFO.write( char_bytes )


#------------------------------------------------------------------------------
def writeBytes( uint, numBytes=1 ):
    # handle someone passing in a string, convert it to int if so.
    if type(uint) is str:
        uint = int(uint)
    uint_bytes = uint.to_bytes( numBytes, byteorder='little', signed=False )
    global commandFIFO
    commandFIFO.write( uint_bytes )


#------------------------------------------------------------------------------
# Must open/close the FIFO for the bytes to be written to disk.
def openFIFO():
    global commandFIFO
    global commandFIFO_fileName
    logging.debug('opening %s' % commandFIFO_fileName)
    if None == commandFIFO_fileName:
        logging.critical('iot_publisher: Missing commandFIFO_fileName')
        return
    commandFIFO = open( commandFIFO_fileName, 'wb' )

#------------------------------------------------------------------------------
def closeFIFO():
    global commandFIFO
    logging.debug('closing %s' % commandFIFO_fileName)
    commandFIFO.close() 


#------------------------------------------------------------------------------
def validDictKey( d, key ):
    if key in d:
        return True
    else:
        return False


#------------------------------------------------------------------------------
# Parse and write (to the FIFO) the received single command message.
# Returns True or False.
def parseCommand( d, messageId ):
    try:
        # validate keys
        if not validDictKey( d, CMD ):
            logging.error( 'Message is missing %s key.' % CMD )
            return False
        if not validDictKey( d, ARG0 ):
            logging.error( 'Message is missing %s key.' % ARG0 )
            return False
        if not validDictKey( d, ARG1 ):
            logging.error( 'Message is missing %s key.' % ARG1 )
            return False

        # validate the command
        commands = [CMD_RUN, CMD_STOP, CMD_LOAD, CMD_ADD, CMD_EXIT, CMD_STATUS,
                CMD_NOOP, CMD_RESET]
        cmd = d[CMD].lower() # compare string command in lower case
        if cmd not in commands:
            logging.error( '%s is not a valid command.' % d[CMD] )
            return False

        logging.debug('Received command messageId=%s %s %s %s' % 
                (messageId, d[CMD], d[ARG0], d[ARG1]))

        # write the binary brain command to the FIFO
        # (the brain will validate the args)
        if cmd == CMD_RUN or \
           cmd == CMD_STOP:
            # arg0: treatment id 0 < 4.
            if d[ARG0] not in ['0', '1', '2', '3']:
                logging.error( '%s is not a valid treatmentID.' % d[ARG0] )
                return False
            logging.info( 'Write: %s %d treatmentID: %s' % \
                ( cmd, CMDS[ cmd], d[ARG0] ))
            openFIFO()
            writeBytes( CMDS[ cmd] )
            writeBytes( 5 )                 # write a one byte msg.len of 5
            writeBytes( messageId, numBytes=4 ) # write 4 bytes to msg.data
            writeBytes( int( d[ARG0] ) )    # write 1 byte to msg.data 
            closeFIFO()
            return True

        if cmd == CMD_LOAD:
            # arg0: variable name (depends on hard coded hardware config).
            # arg1: JSON recipe string (about 1.8KB).
            logging.info( 'Write: %s %d variable: %s recipe: %s' % \
                ( cmd, CMDS[ cmd], d[ARG0], d[ARG1] ))

            # read the passed in JSON string into our class
            r = Recipe();
            if not r.readJSONstring( d[ARG1] ):
                logging.error( 'Could not parse JSON recipe' )
                return False

            # make a temporary file name for the binary recipe
            tup = tempfile.mkstemp( suffix='.recipe', \
                prefix='tmp.', dir='/tmp' )

            # the above function opened the file for us, so close it 
            # (we just need the name)
            os.close( tup[0] )      # file descriptor is first in the tupple
            tempFileName = tup[1]   # temp file name

            # write the recipe to this temp binary file
            if not r.writeBinaryFile( tempFileName ):
                logging.error( 'Did not write binary recipe to %s' % \
                    tempFileName )
                return False

            openFIFO()
            writeBytes( CMDS[ cmd] )
            # len = 4 messageId + 2 NULLs + size of var name + size of path 
            dataLen = 4 + 2 + len( d[ARG0] ) + len( tempFileName )
            writeBytes( dataLen )           # write a one byte msg.len 
            writeBytes( messageId, numBytes=4 ) # write 4 bytes to msg.data
            for c in d[ARG0]:               # write variable name
                writeChar( c )              # write a char at a time to msg.data
            writeBytes( 0 )                 # string terminating NULL
            for c in tempFileName:          # write temp binary recipe file name
                writeChar( c )              # write a char at a time to msg.data
            writeBytes( 0 )                 # string terminating NULL
            closeFIFO()
            return True


        if cmd == CMD_ADD:
            # arg0: treatment id 0 < 4.
            if d[ARG0] not in ['0', '1', '2', '3']:
                logging.error( '%s is not a valid treatmentID.' % d[ARG0] )
                return False
            # arg1: variable name (depends on hard coded hardware config).
            logging.info( 'Write: %s %d treatmentID: %s variable: %s' % \
                ( cmd, CMDS[ cmd], d[ARG0], d[ARG1] ))

            openFIFO()
            writeBytes( CMDS[ cmd] )
            # len = 4 messageId + 1 treatmentId + 1 NULL + size of var name 
            dataLen = 4 + 1 + 1 + len( d[ARG1] ) 
            writeBytes( dataLen )           # write a one byte msg.len 
            writeBytes( messageId, numBytes=4 ) # write 4 bytes to msg.data
            writeBytes( int( d[ARG0] ) )    # write treatmentID
            for c in d[ARG1]:
                writeChar( c )              # write char at a time to msg.data
            writeBytes( 0 )                 # string terminating NULL
            closeFIFO()
            return True


        if cmd == CMD_EXIT or \
           cmd == CMD_STATUS or \
           cmd == CMD_NOOP or \
           cmd == CMD_RESET:
            logging.info( 'Write: %s %d' % ( cmd, CMDS[ cmd] ))
            openFIFO()
            writeBytes( CMDS[ cmd] )
            writeBytes( 4 )                 # write a one byte msg.len of 4
            writeBytes( messageId, numBytes=4 ) # write 4 bytes to msg.data
            closeFIFO()
            return True

    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception in parseCommand(): %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )
        return False

"""
this is the openag_sockets.h struct that is read:

typedef struct __attribute__((packed)) {
    uint8_t type;
    uint8_t len;
    uint8_t data[OA_SOCKETS_MSG_MAX_LEN];
} oa_msg_t;
    
"""


#------------------------------------------------------------------------------
# Parse the config messages we receive.
# Arg: dictionary created from the data received with the config MQTT message.
def parseConfigMessage( d ):
    try:
        if not validDictKey( d, COMMANDS ):
            logging.error( 'Message is missing %s key.' % COMMANDS )
            return

        if not validDictKey( d, MESSAGEID ):
            logging.error( 'Message is missing %s key.' % MESSAGEID )
            return 

        # unpack an array of commands from the dict
        for cmd in d[ COMMANDS ]:
            parseCommand( cmd, d[ MESSAGEID ] )

    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception in parseConfigMessage(): %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


#------------------------------------------------------------------------------
def publishEnvVar( client, topic, messageType, experiment, treatment, 
                   varName, values ):
    try:
        # create a python dict object, which will be serialized and published
        message_obj = {}
        message_obj['messageType'] = messageType
        message_obj['exp'] = experiment
        message_obj['treat'] = treatment
        message_obj['var'] = varName
        message_obj['values'] = values

        message_json = json.dumps( message_obj ) # dict obj to JSON string

        # Publish the message to the MQTT topic. qos=1 means at least once
        # delivery. Cloud IoT Core also supports qos=0 for at most once
        # delivery.
        client.publish( topic, message_json, qos=1 )

        logging.info('publishEnvVar: sent \'%s\' to %s' % 
                (message_json, topic))
        return True

    except Exception as e:
        logging.critical( "publishEnvVar: Exception: %s" % e)
        return False


#------------------------------------------------------------------------------
# Publish a reply to a command that was received and successfully processed
# as an environment variable.
#
# ddict contains:
#   'command_reply': <command name>
#   'values': <single quoted json string>
#
def publishCommandReply( client, topic, experiment, treatment, ddict ):
    try:
        if not 'command_reply' in ddict:
            logging.error( "publishCommandReply: missing command_reply" )
            return False

        if not 'values' in ddict:
            logging.error( "publishCommandReply: missing values" )
            return False

        # publish the command reply as an env. var.
        publishEnvVar( client, topic, 'CommandReply',  # messageType
                experiment, 
                treatment, 
                ddict['command_reply'], # varName = the command name
                ddict['values'] )       # all command args and tracking info
        return True

    except Exception as e:
        logging.critical( "publishCommandReply: Exception: %s" % e)
        return False


#------------------------------------------------------------------------------
# read the header info from the passed in json string
# and store the meta info in our globals
def getHeader( header ):
    global TREAT
    TREAT = {}
    global TREAT_ID
    TREAT_ID = -1

    # read header JSON string, newline delimited
    try:
        logging.debug( 'iot_pubsub: Treatment[%s]: %s' %
            ( header['treatment_id'], header['treatment_name'] ))

        # save header to new dict
        TREAT_ID = header['treatment_id']
        tname = header['treatment_name'].replace( '~', '' ) # clean string
        if 0 == len( tname ):
            tname = TreatName
        tvars = {} # empty dict to hold all the variables for this treat
        TREAT[ header['treatment_id'] ] = \
            dict([ ('name', tname ), ('vars', tvars) ])

        for v in header['variables']:
            logging.debug( 'iot_pubsub:  Variable[%s]: %s, %s' % 
                ( v['id'], v['name'], v['type'] ))
            # save to new vars dict
            vname = v['name'].replace( '~', '' )
            vtype = v['type'].replace( '~', '' )
            tvars[ v['id'] ] = dict([( 'name', vname ), ( 'type', vtype )])
        return True

    except( Exception ) as e:
        logging.critical( "iot_pubsub: Exception reading header:", e )
        return False


#------------------------------------------------------------------------------
"""
Creates a JWT (https://jwt.io) to establish an MQTT connection.
  Args:
    project_id: The cloud project ID this device belongs to
    private_key_file: A path to a file containing an RSA256 private key.
    algorithm: The encryption algorithm to use: 'RS256'.
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

    logging.debug('Creating JWT using {} from private key file {}'.format(
            algorithm, private_key_file ))

    return jwt.encode(token, private_key, algorithm=algorithm)


#------------------------------------------------------------------------------
""" Convert a Paho error to a human readable string.  """
def error_str(rc):
    return '{}: {}'.format(rc, mqtt.error_string(rc))


#------------------------------------------------------------------------------
""" Callback for when a device connects.  """
def on_connect(unused_client, unused_userdata, unused_flags, rc):
    logging.debug('on_connect: {}'.format( mqtt.connack_string(rc)))


#------------------------------------------------------------------------------
""" Paho callback for when a device disconnects.  """
def on_disconnect(unused_client, unused_userdata, rc):
    logging.debug('on_disconnect: {}'.format( error_str(rc)))


#------------------------------------------------------------------------------
"""Paho callback when a message is sent to the broker."""
def on_publish(unused_client, unused_userdata, unused_mid):
    logging.debug( 'on_publish' )


#------------------------------------------------------------------------------
"""Callback when the device receives a message on a subscription."""
def on_message( unused_client, unused_userdata, message ):
    payload = message.payload.decode( 'utf-8' )
    # message is a paho.mqtt.client.MQTTMessage, these are all properties:
    logging.debug('Received message:\n  {}\n  topic={}\n  Qos={}\n  mid={}\n  '
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
        return

    # The broker will keep sending config messages everytime we connect.
    # So compare this message (if a config message) to the last config
    # version we have seen.
    global lastConfigVersion 
    if messageVersion > lastConfigVersion:
        # write our local config file
        lastConfigVersion = messageVersion
        global DeviceId 
        config = { 'lastConfigVersion': lastConfigVersion,
                   'device_id': DeviceId }
        with open( 'config.json', 'w') as f:
            json.dump( config, f )

        # parse the config message to get the commands in it
        # (and write them to the command pipe)
        parseConfigMessage( payloadDict )
    else:
        logging.debug('Ignoring this old config message.\n')




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
def getMQTTclient(
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
    # describes additional callbacks that Paho supports. 
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    #client.on_publish = on_publish         # only for debugging
    #client.on_subscribe = on_subscribe     # only for debugging
    #client.on_log = on_log                 # only for debugging

    # Connect to the Google MQTT bridge.
    client.connect( mqtt_bridge_hostname, mqtt_bridge_port )

    # This is the topic that the device will receive COMMANDS on:
    mqtt_config_topic = '/devices/{}/config'.format( device_id )
    logging.debug('mqtt_config_topic={}'.format( mqtt_config_topic ))

    # Subscribe to the config topic.
    client.subscribe( mqtt_config_topic, qos=1 )

    # Turn on paho debugging if debug log enabled on command line.
    global LogNumericLevel 
    if LogNumericLevel == logging.DEBUG:
        client.enable_logger() 

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
            '--registry_id', 
            required=True, 
            help='Cloud IoT Core registry id')
    parser.add_argument(
            '--device_id', 
            default=None,
            help='Cloud IoT Core device id')
    parser.add_argument(
            '--private_key_file',
            required=True, 
            help='Path to private key file.')
    parser.add_argument(
            '--cloud_region', 
            default='us-central1', 
            help='GCP cloud region')
    parser.add_argument(
            '--ca_certs',
            default='roots.pem',
            help=('CA root from https://pki.google.com/roots.pem'))
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
    parser.add_argument( 
            '--dataFIFO', 
            type=str, 
            required=True,
            help='data FIFO path' )
    parser.add_argument( 
            '--commandFIFO', 
            type=str, 
            required=True,
            help='command FIFO path' )
    parser.add_argument( 
            '--experiment', 
            type=str, 
            default='Exp',
            help='Experiment name.' )
    parser.add_argument( 
            '--treatment', 
            type=str, 
            default='Treat',
            help='Treatment name.' )

    args = parser.parse_args()

    # default log file and level
    logging.basicConfig( level=logging.ERROR ) # can only call once

    # user specified log level
    global LogNumericLevel 
    LogNumericLevel = getattr( logging, args.log.upper(), None )
    if not isinstance( LogNumericLevel, int ):
        logging.critical('iot_pubsub: Invalid log level: %s' % args.log )
        LogNumericLevel = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=LogNumericLevel )

    return args



#------------------------------------------------------------------------------
def main():
    # read our local config file if it exists
    global lastConfigVersion 
    global DeviceId 
    try:
        with open( 'config.json', 'r') as f:
            config = json.load( f )
        if 'lastConfigVersion' in config:
            lastConfigVersion = int( config['lastConfigVersion'] )
        if 'device_id' in config:
            DeviceId = config['device_id']
    except Exception as e:
        lastConfigVersion = 0

    # parse command line args
    args = parse_command_line_args()

    # validate our DeviceId
    if None == DeviceId:           # nothing read from the config file
        DeviceId = args.device_id  # use the command line?
    if None == DeviceId or 0 == len( DeviceId ):
        logging.error( 'Invalid device_id on the command line.' )
        exit( 1 )
    logging.debug('Using device_id={}'.format( DeviceId ))

    # clean ID items, can't have any ~
    args.experiment = args.experiment.replace( '~', '' )
    args.treatment = args.treatment.replace( '~', '' )

    # Publish to the MQTT events topic 
    mqtt_topic = '/devices/{}/events'.format( DeviceId )
    logging.debug('mqtt_topic={}'.format( mqtt_topic))

    jwt_iat = datetime.datetime.utcnow()
    jwt_exp_mins = args.jwt_expires_minutes
    client = getMQTTclient(
        args.project_id, args.cloud_region, args.registry_id, DeviceId,
        args.private_key_file, EncryptionAlgorithm, args.ca_certs,
        args.mqtt_bridge_hostname, args.mqtt_bridge_port )

    logging.info( 'iot_pubsub: Waiting for data in the pipe...' )

    # save the treatment and variables in a dict for easier data processing
    # (we currently only support ONE treatment running at a time)
    global TREAT
    global TREAT_ID

    logging.info( 'iot_pubsub: using command FIFO %s' % args.commandFIFO )
    global commandFIFO_fileName
    commandFIFO_fileName = args.commandFIFO

    logging.debug( 'iot_pubsub: opening %s' % args.dataFIFO )
    # this blocks until there is something written to the pipe!
    f = open( args.dataFIFO, 'r', newline='' )

    # read data JSON strings from brain pipe
    while True:
        try:
            # Process network events.
            client.loop()

#debugrob hack to send a message every 5 sec (so we don't have to mess with data.fifo)
            publishEnvVar( client, mqtt_topic, 
                'CommandReply',  # messageType
                'RobExp', 
                'RobTreat', 
                'status', # varName = the command name
                '{"name":"rob"}' )       # all command args and tracking info

            SELECT_TIMEOUT = 5 # seconds
            read_ready, wignore, xignore = \
                    select.select( [f], [], [], SELECT_TIMEOUT ) 
            if [] == read_ready:
                # there is nothing ready to read on the pipe, so keep waiting
                continue

            # blocking read on the data pipe
            data_bytes = f.readline()
            logging.debug( 'iot_pubsub: data_bytes=\'%s\'' % data_bytes )
            if len( data_bytes ) == 0:
                # we read zero bytes when the writer closes their file
                # handle to the pipe. so reopen it.
                logging.debug( 'iot_pubsub: zero data_bytes! reopen data.fifo')
                # this blocks until there is something written to the pipe!
                f = open( args.dataFIFO, 'r', newline='' )
                continue

            if 'exit' == data_bytes:
                logging.critical('iot_pubsub: Received exit command, ' 
                    'so exiting process.')
                exit( 0 )

            # safely try to convert the data we read into a dict
            try:
                # make a py dict from JSON string
                data = json.loads( data_bytes ) 
            except( Exception ) as e:
                logging.error('iot_pubsub: read invalid data from pipe.')
                continue

            # refresh the JWT if it is about to expire
            seconds_since_issue = (datetime.datetime.utcnow() - jwt_iat).seconds
            if seconds_since_issue > 60 * jwt_exp_mins:
                logging.debug('Refreshing token after {}s').format(
                        seconds_since_issue)
                jwt_iat = datetime.datetime.utcnow()
                client = getMQTTclient(
                    args.project_id, args.cloud_region,
                    args.registry_id, DeviceId, args.private_key_file,
                    EncryptionAlgorithm, args.ca_certs, 
                    args.mqtt_bridge_hostname, args.mqtt_bridge_port )

            # verify which json object this is
            if 'command_reply' in data:  # does the dict contain this key ?
                publishCommandReply( client, mqtt_topic, 
                    args.experiment, args.treatment, data )
                continue 

            if 'treatment_id' in data:  # does the dict contain a key we need?
                getHeader( data ) # this should be our header json obj.
                continue 

            # at this point, we must have an env-var json object?
            if 't_id' not in data:  
                logging.critical('iot_pubsub: received unknown data.')
                continue 

            if TREAT_ID == -1:
                logging.critical('iot_pubsub: out of sync with brain, '
                    'didn\'t get header information.')
                continue 

            tvars = TREAT[ data['t_id'] ]['vars']
            varName = tvars[ data['v_id'] ]['name']
            values = ''
            if 'values' in data:
                values = data['values'] # a complex json style string

            # continue processing the data here
            logging.debug( 'iot_pubsub: %s[%s], %s[%s], values:%s' % 
                    ( TREAT[ data['t_id'] ]['name'], data['t_id'], 
                      tvars[ data['v_id'] ]['name'], data['v_id'], 
                      values ))

            # NOTE: not sending set_point now, ignoring ts from brain.

            publishEnvVar( client, mqtt_topic, 
                           'EnvVar', # messageType
                           args.experiment, 
                           TREAT[ data['t_id'] ]['name'],  # treatment name
                           varName, values )

        except( Exception ) as e:
            logging.critical( "iot_pubsub: Exception reading data:", e )

    # end of infinite while loop

    f.close()  # close data pipe from brain
    # end of main()



#------------------------------------------------------------------------------
if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception in main(): %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


