#!/usr/bin/env python3


# 1. Receive JSON commands that are published by the backend, and subscribed
#    for by this device.
# 2. Write binary commands to the brain input command.fifo.
# 3.  See the ../commands.md for the API
# rbaynes 2018-02-01

import os, sys, time, json, argparse, traceback, tempfile, logging, signal
from google.cloud import pubsub
from recipe_lib import Recipe # local library


# Handle the user pressing Control-C
def signal_handler(signal, frame):
    logging.critical( 'Exiting.' )
    sys.exit(0)
signal.signal( signal.SIGINT, signal_handler )


DeviceID = os.getenv('DEVICEID')


# some constants
COMMANDS    = 'commands'
MESSAGEID   = 'messageId'
DEVICEID    = 'deviceId'
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
CMDS = {
    CMD_RUN   :1,
    CMD_STOP  :2,
    CMD_LOAD  :3,
    CMD_ADD   :4,
    CMD_EXIT  :5,
    CMD_STATUS:6,
    CMD_NOOP  :7,
    CMD_RESET :8 }

# globals
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
        logging.critical('Missing commandFIFO_fileName')
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
# This callback is called for each message we receive.
# We acknowledge the message, then validate and act on it if valid.
def callback( message ):
    try:
        message.ack() # acknowledge to the server that we got the message

        d = json.loads( message.data.decode('utf-8') ) # make a dict 

        if not validDictKey( d, COMMANDS ):
            logging.error( 'Message is missing %s key.' % COMMANDS )
            return

        if not validDictKey( d, MESSAGEID ):
            logging.error( 'Message is missing %s key.' % MESSAGEID )
            return 

        if not validDictKey( d, DEVICEID ):
            logging.error( 'Message is missing %s key.' % DEVICEID )
            return 

        # is the message for this device (should get deviceId from config file)
        if DeviceID != d[ DEVICEID ]:
            logging.error( 'DeviceID %s doesn\'t match' % DEVICEID )
            return 

        # unpack an array of commands from the dict
        for cmd in d[ COMMANDS ]:
            parseCommand( cmd, d[ MESSAGEID ] )

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
    parser.add_argument( '--commandFIFO', type=str, 
                         help='binary command FIFO to write', 
                         default='../data/command.fifo' )
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


    logging.info( 'Using command FIFO %s' % args.commandFIFO )
    global commandFIFO_fileName
    commandFIFO_fileName = args.commandFIFO
    
    if None == DeviceID:
        logging.critical('Missing DEVICEID environment variable.')
        exit( 1 )

    # make sure our env. vars are set up
    if None == os.getenv('GCLOUD_PROJECT') or None == os.getenv('GCLOUD_CMDS'):
        logging.critical('Missing required environment variables.')
        exit( 1 )

    # instantiate a client
    client = pubsub.SubscriberClient()

    # the resource path for the topic 
    subs_path = client.subscription_path( os.getenv('GCLOUD_PROJECT'), 
                                          os.getenv('GCLOUD_CMDS') )

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




