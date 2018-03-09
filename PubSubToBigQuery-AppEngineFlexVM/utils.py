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
messageType_CommandReply = 'CommandReply'

# keys for messageType='EnvVar' (and also 'CommandReply')
deviceId_KEY = 'deviceId'
exp_KEY = 'exp'
treat_KEY = 'treat'
var_KEY = 'var'
values_KEY = 'values'


#------------------------------------------------------------------------------
def makeEnvVarDict( valueDict, envVarList, idKey ):
    # each received EnvVar type message must have these fields
    if not validDictKey( valueDict, deviceId_KEY ) or \
       not validDictKey( valueDict, exp_KEY ) or \
       not validDictKey( valueDict, treat_KEY ) or \
       not validDictKey( valueDict, var_KEY ) or \
       not validDictKey( valueDict, values_KEY ):
        logging.critical('Invalid key in dict.')
        return

    deviceID =  valueDict[ deviceId_KEY ]
    expName =   valueDict[ exp_KEY ]
    treatName = valueDict[ treat_KEY ]
    varName =   valueDict[ var_KEY ]
    values =  valueDict[ values_KEY ]

    # clean / scrub / check the values.  
    deviceID = deviceID.replace( '~', '' ) 
    expName = expName.replace( '~', '' ) 
    treatName = treatName.replace( '~', '' ) 
    varName = varName.replace( '~', '' ) 

    # <expName>~<KEY>~<treatName>~<valName>~<created UTC TS>~<deviceID>
    ID = expName + '~' + idKey + '~{}~{}~{}~' + deviceID

    schemaDict = {}
    schemaDict[ 'id' ] = ID.format( treatName, varName, 
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() ))
    schemaDict[ 'values' ] = values

    # NOTE: X, Y not being sent from device, so not stored in DB.

    envVarList.append( schemaDict )


#------------------------------------------------------------------------------
def makeDict( valueDict, envVarList ):

    if not validDictKey( valueDict, messageType_KEY ):
        logging.critical('Missing key %s' % messageType_KEY )
        return

    if messageType_EnvVar == valueDict[ messageType_KEY ]:
        makeEnvVarDict( valueDict, envVarList, 'Env' )
        return

    if messageType_CommandReply == valueDict[ messageType_KEY ]:
        makeEnvVarDict( valueDict, envVarList, 'Cmd' )
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

        # Generate the data that will be sent to BigQuery for insertion.
        # Each value must be a JSON object that matches the table schema.
        envVarList = []
        for valueDict in values:

            # only one of these temporary lists will be added to
            tmpEnvVars = []
            # process each value here to make it table schema compatible
            makeDict( valueDict, tmpEnvVars )

            if 0 < len( tmpEnvVars ):
                for envVar in tmpEnvVars:
                    item_row = {"json": envVar}
                    envVarList.append( item_row )

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

#debugrob: I need to validate the user / openag flag, to know the correct DS.

#debugrob: new bigquery api: (still streaming)
#    def insert_rows(self, table, rows, selected_fields=None, **kwargs):

        return 

    except Exception as e:
        logging.critical( "Exception: %s" % e )




