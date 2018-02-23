#!/usr/bin/env python3

""" This file contains some utilities used for processing data and 
    writing data to BigQuery.
"""

import os, collections, datetime, time, logging

from apiclient import discovery
import dateutil.parser
import httplib2
from oauth2client.client import GoogleCredentials

SCOPES = ['https://www.googleapis.com/auth/bigquery',
          'https://www.googleapis.com/auth/pubsub']

# should be enough retries to insert into BQ
NUM_RETRIES = 3

# Check for the latest API versions here:
# https://developers.google.com/api-client-library/python/apis/
BQ_API='bigquery'
BQ_API_VER='v2'
PS_API='pubsub'
PS_API_VER='v1beta2'

# Python API docs here (that match the above versions)
# https://developers.google.com/resources/api-libraries/documentation/bigquery/v2/python/latest/
# https://developers.google.com/resources/api-libraries/documentation/pubsub/v1beta2/python/latest/index.html

#------------------------------------------------------------------------------
# Get the Google credentials needed to access our services.
def get_credentials():
    credentials = GoogleCredentials.get_application_default()
    if credentials.create_scoped_required():
        credentials = credentials.create_scoped( SCOPES )
    return credentials


#------------------------------------------------------------------------------
# Build the bigquery client using the API discovery service.
def create_bigquery_client( credentials ):
    http = httplib2.Http()
    credentials.authorize( http )
    return discovery.build( BQ_API, BQ_API_VER, http=http )


#------------------------------------------------------------------------------
# Build the pubsub client.
def create_pubsub_client( credentials ):
    http = httplib2.Http()
    credentials.authorize(http)
    return discovery.build( PS_API, PS_API_VER, http=http )


#------------------------------------------------------------------------------
def validDictKey( d, key ):
    if key in d:
        return True
    else:
        return False

#------------------------------------------------------------------------------
# Add a dict that matches the table schema for the received message to one
# of the two lists passed in.
# (python will pass only mutable objects (list) by reference)

# keys common to all messages
messageType_KEY = 'messageType'
messageType_EnvVar = 'EnvVar'
messageType_Status = 'Status'
messageType_CommandReply = 'CommandReply'

# keys for messageType='EnvVar'
deviceId_KEY = 'deviceId'
exp_KEY = 'exp'
treat_KEY = 'treat'
var_KEY = 'var'
type_KEY = 'type'
value_KEY = 'value'

# keys for messageType='Status'
status_KEY = 'status'
messageId_KEY = 'messageId'
# plus deviceId_KEY from above

# keys for messageType='CommandReply'
command_KEY = 'command'
senderId_KEY = 'senderId'
userId_KEY = 'userId'
# plus deviceId_KEY from above
# plus messageId_KEY from above


#------------------------------------------------------------------------------
def makeEnvVarDict( valueDict, envVarList ):
    # each received EnvVar type message must have these fields
    if not validDictKey( valueDict, deviceId_KEY ) or \
       not validDictKey( valueDict, exp_KEY ) or \
       not validDictKey( valueDict, treat_KEY ) or \
       not validDictKey( valueDict, var_KEY ) or \
       not validDictKey( valueDict, type_KEY ) or \
       not validDictKey( valueDict, value_KEY ):
        logging.critical('Invalid key in dict.')
        return

    deviceID =  valueDict[ deviceId_KEY ]
    expName =   valueDict[ exp_KEY ]
    treatName = valueDict[ treat_KEY ]
    varName =   valueDict[ var_KEY ]
    varType =   valueDict[ type_KEY ]
    varValue =  valueDict[ value_KEY ]

    # clean / scrub / check the values.  
    deviceID = deviceID.replace( '~', '' ) 
    expName = expName.replace( '~', '' ) 
    treatName = treatName.replace( '~', '' ) 
    varName = varName.replace( '~', '' ) 

    schemaDict = {}
    valueTypeKey = 'sval' # default
    if 'float' == varType:
        valueTypeKey = 'fval'
    if 'int' == varType:
        valueTypeKey = 'ival'
    # <expName>~<KEY>~<treatName>~<valName>~<created UTC TS>~<deviceID>
    ID = expName + '~Env~{}~{}~{}~' + deviceID
    schemaDict['id'] = ID.format( treatName, varName, 
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() ))
    schemaDict['type'] = varType
    schemaDict[ valueTypeKey ] = varValue
    envVarList.append( schemaDict )


#------------------------------------------------------------------------------
def makeStatusDict( valueDict, statusList ):
    # each received dict must have these fields
    if not validDictKey( valueDict, status_KEY ) or \
       not validDictKey( valueDict, messageId_KEY ) or \
       not validDictKey( valueDict, deviceId_KEY ):
        logging.critical('Invalid key in dict.')
        return

    status =    valueDict[ status_KEY ]
    messageId = valueDict[ messageId_KEY ]
    deviceID =  valueDict[ deviceId_KEY ]

    # clean / scrub / check the values.  
    deviceID = deviceID.replace( '~', '' ) 

    schemaDict = {}

    # build a DB row that matches the table schema
    # <deviceId>~<created UTC TS>
    ID = deviceID + '~{}'
    schemaDict['id'] = ID.format( 
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() ))
    schemaDict['status'] = status
    schemaDict['messageId'] = messageId
    statusList.append( schemaDict )


#------------------------------------------------------------------------------
def makeCommandReplyDict( valueDict, commandReplyList ):
    # each received dict must have these fields
    if not validDictKey( valueDict, command_KEY ) or \
       not validDictKey( valueDict, senderId_KEY ) or \
       not validDictKey( valueDict, deviceId_KEY ) or \
       not validDictKey( valueDict, userId_KEY ) or \
       not validDictKey( valueDict, messageId_KEY ):
        logging.critical('Invalid key in dict.')
        return

    command =   valueDict[ command_KEY ]
    senderId =  valueDict[ senderId_KEY ]
    deviceID =  valueDict[ deviceId_KEY ]
    userID =    valueDict[ userId_KEY ]
    messageId = valueDict[ messageId_KEY ]

    # clean / scrub / check the values.  
    deviceID = deviceID.replace( '~', '' ) 
    userID = userID.replace( '~', '' ) 

    schemaDict = {}

    # build a DB row that matches the table schema
    # <deviceId>~<userId>~<created UTC TS>
    ID = deviceID + '~' + userID + '~{}'
    schemaDict['id'] = ID.format( 
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() ))
    schemaDict['type'] = 'reply'
    schemaDict['messageId'] = messageId
    schemaDict['senderId'] = senderId
    schemaDict['message'] = command # needs to be JSON?
    commandReplyList.append( schemaDict )



#------------------------------------------------------------------------------
def makeDict( valueDict, envVarList, statusList, commandReplyList ):

    if not validDictKey( valueDict, messageType_KEY ):
        logging.critical('Missing key %s' % messageType_KEY )
        return

    if messageType_EnvVar == valueDict[ messageType_KEY ]:
        makeEnvVarDict( valueDict, envVarList )
        return

    if messageType_Status == valueDict[ messageType_KEY ]:
        makeStatusDict( valueDict, statusList )
        return

    if messageType_CommandReply == valueDict[ messageType_KEY ]:
        makeCommandReplyDict( valueDict, commandReplyList )
        return



#------------------------------------------------------------------------------
# Insert data into BQ based on its type.
# Values is a list of dictionaries.  
# Each must be checked to know its type to know the destination table.
def bq_data_insert( bigquery, project_id, values ):
    try:
        # for env. vars
        varDS = os.environ['BQ_DATASET'] 
        varTable = os.environ['BQ_TABLE']
        # for status
        userDS = os.environ['BQ_USER_DATASET'] 
        statusTable = os.environ['BQ_STATUS_TABLE']
        commandTable = os.environ['BQ_COMMAND_TABLE']

#debugrob: check if user has 'valid' flag True on their account.

        # Generate the data that will be sent to BigQuery for insertion.
        # Each value must be a JSON object that matches the table schema.
        envVarList = []
        statusList = []
        commandReplyList = []
        for valueDict in values:

            # only one of these temporary lists will be added to
            tmpEnvVar = []
            tmpStatus = []
            tmpCommandReply = []
            # process each value here to make it table schema compatible
            makeDict( valueDict, tmpEnvVar, tmpStatus, tmpCommandReply )

            if 1 == len( tmpEnvVar ):
                item_row = {"json": tmpEnvVar[0]}
                envVarList.append( item_row )

            if 1 == len( tmpStatus ):
                item_row = {"json": tmpStatus[0]}
                statusList.append( item_row )

            if 1 == len( tmpCommandReply ):
                item_row = {"json": tmpCommandReply[0]}
                commandReplyList.append( item_row )

        if 0 < len( envVarList ):
            body = {"rows": envVarList}
            logging.info( "bq sending vars: %s" % ( body ))
            # Call the BQ streaming API for data insertion
            response = bigquery.tabledata().insertAll(
                projectId=project_id, datasetId=varDS,
                tableId=varTable, body=body ).execute( 
                        num_retries=NUM_RETRIES )
            logging.info( "bq resp: %s %s" % 
                    ( datetime.datetime.now(), response ))

        if 0 < len( statusList ):
            body = {"rows": statusList}
            logging.info( "bq sending status: %s" % ( body ))
            response = bigquery.tabledata().insertAll(
                projectId=project_id, datasetId=userDS,
                tableId=statusTable, body=body ).execute( 
                        num_retries=NUM_RETRIES )
            logging.info( "bq resp: %s %s" % 
                    ( datetime.datetime.now(), response ))

        if 0 < len( commandReplyList ):
            body = {"rows": commandReplyList}
            logging.info( "bq sending command reply: %s" % ( body ))
            response = bigquery.tabledata().insertAll(
                projectId=project_id, datasetId=userDS,
                tableId=commandTable, body=body ).execute( 
                        num_retries=NUM_RETRIES )
            logging.info( "bq resp: %s %s" % 
                    ( datetime.datetime.now(), response ))

#debugrob: I need to validate the user / openag flag, to know the correct DS.

#debugrob: use a JOB here, not a streaming insertAll() which blocks deletion/updates for 24 hours.

#debugrob: new bigquery api: (still streaming)
#    def insert_rows(self, table, rows, selected_fields=None, **kwargs):

#debugrob TODO: 'invalid field' errors can be detected here.

        return 

    except Exception as e:
        logging.critical( "Exception: %s" % e )




