#!/usr/bin/env python3

#debugrob: DONE copying this logic over to iot_pubsub.py
import os, time, json, argparse, logging
from google.cloud import pubsub


ExperimentName = os.getenv('EXPERIMENT')
if None == ExperimentName:
    ExperimentName = 'TestExp'

TreatName = os.getenv('TREATMENT')
if None == TreatName:
    TreatName = 'TestTreat' 

UserID = os.getenv('OPENAG_USER')
if None == UserID:
    UserID = 'zombie@mit.edu'

DeviceID = os.getenv('DEVICEID')
# validated in main

# globals used to hold our meta info
TREAT = {}
TREAT_ID = -1


#------------------------------------------------------------------------------
def publishEnvVar( publisher, topic, messageType, treatName, varName, values ):
    try:
        # create a python dict object, which will be serialized and published
        message_obj = {}
        message_obj['messageType'] = messageType
        message_obj['deviceId'] = DeviceID
        message_obj['exp'] = ExperimentName
        message_obj['treat'] = treatName
        message_obj['var'] = varName
        message_obj['values'] = values

        message_json = json.dumps( message_obj ) # dict obj to JSON string

        # publish the message 
        future = publisher.publish( topic, message_json.encode('utf-8') )

        # result() blocks until future is complete 
        # (when message is ack'd by server)
        message_id = future.result()
        logging.debug('publishEnvVar: from future, message_id: {}'.format(
                message_id))
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
def publishCommandReply( publisher, topic, ddict ):
    try:
        if not 'command_reply' in ddict:
            logging.error( "publishCommandReply: missing command_reply" )
            return False

        if not 'values' in ddict:
            logging.error( "publishCommandReply: missing values" )
            return False

        # publish the command reply as an env. var.
        publishEnvVar( publisher, topic, 'CommandReply',  # messageType
                '',                     # no treat
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
        logging.debug( 'publisher: Treatment[%s]: %s' %
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
            logging.debug( 'publisher:  Variable[%s]: %s, %s' % 
                ( v['id'], v['name'], v['type'] ))
            # save to new vars dict
            vname = v['name'].replace( '~', '' )
            vtype = v['type'].replace( '~', '' )
            tvars[ v['id'] ] = dict([( 'name', vname ), ( 'type', vtype )])
        return True

    except( Exception ) as e:
        logging.critical( "publisher: Exception reading header:", e )
        return False


#------------------------------------------------------------------------------
def main():

    # default log file and level
    logging.basicConfig( level=logging.ERROR ) # can only call once

    if None == DeviceID:
        logging.critical('publisher: Exiting. Missing DEVICEID environment variable.')
        exit( 1 )

    # make sure our env. vars are set up
    if None == os.getenv('GCLOUD_PROJECT') or None == os.getenv('GCLOUD_TOPIC'):
        logging.critical('publisher: Exiting. Missing GCLOUD env. vars.')
        exit( 1 )

    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--dataFIFO', type=str, help='data FIFO path',
                         required=True )
    parser.add_argument( '--log', type=str, 
        help='log level: debug, info, warning, error, critical', 
        default='error' )
    args = parser.parse_args()

    # instantiate a google pubsub client
    publisher = pubsub.PublisherClient()

    # the resource path for the topic 
    topic_path = publisher.topic_path( 
            os.getenv('GCLOUD_PROJECT'), os.getenv('GCLOUD_TOPIC') )

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % \
                args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )

    # clean config items, can't have any ~
    global ExperimentName
    ExperimentName = ExperimentName.replace( '~', '' )
    global UserID
    UserID = UserID.replace( '~', '' )

    logging.info( 'publisher: Waiting for data in the pipe...' )

    # save the treatment and variables in a dict for easier data processing
    # (we currently only support ONE treatment running at a time)
    global TREAT
    global TREAT_ID

    logging.debug( 'publisher: opening %s' % args.dataFIFO )
    f = open( args.dataFIFO, 'r', newline='' )

    # read data JSON strings, newline delimited
    while True:
        try:
            data_bytes = f.readline()
            logging.debug( 'publisher: data_bytes=\'%s\'' % data_bytes )
            if len( data_bytes ) == 0:
                logging.debug( 'publisher: Exiting because brain is probably'
                    ' dead, zero data_bytes!' )
                exit( 0 )
                continue
            if 'exit' == data_bytes:
                logging.critical('publisher: Received exit command, ' 
                    'so exiting process.')
                exit( 0 )
            data = json.loads( data_bytes ) # make a py dict from JSON string

            # verify which json object this is
            if 'command_reply' in data:  # does the dict contain this key ?
                publishCommandReply( publisher, topic_path, data )
                continue 

            if 'treatment_id' in data:  # does the dict contain a key we need?
                getHeader( data ) # this should be our header json obj.
                continue 

            # at this point, we must have an env-var json object?
            if 't_id' not in data:  
                logging.critical('publisher: received unknown data.')
                continue 

            if TREAT_ID == -1:
                logging.critical('publisher: out of sync with brain, '
                    'didn\'t get header information.')
                continue 

            tvars = TREAT[ data['t_id'] ]['vars']
            varName = tvars[ data['v_id'] ]['name']
            #varType = tvars[ data['v_id'] ]['type'] # unused
            values = ''
            if 'values' in data:
                values = data['values'] # a complex json style string

            # continue processing the data here
            logging.debug( 'publisher: %s[%s], %s[%s], values:%s' % 
                    ( TREAT[ data['t_id'] ]['name'], data['t_id'], 
                      tvars[ data['v_id'] ]['name'], data['v_id'], 
                      values ))

            # NOTE: not sending set_point now, ignoring ts from brain.

            publishEnvVar( publisher, topic_path, 
                           'EnvVar', # messageType
                           TREAT[ data['t_id'] ]['name'], 
                           varName, values )

        except( Exception ) as e:
            logging.critical( "publisher: Exception reading data:", e )

    # end of infinite while loop

    f.close()
    # end of main()


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




