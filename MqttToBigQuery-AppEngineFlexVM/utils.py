#!/usr/bin/env python3

""" This file contains some utilities used for processing data and 
    writing data to BigQuery.
"""

import os, time, logging
from google.cloud import bigquery


# should be enough retries to insert into BQ
NUM_RETRIES = 3


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
var_KEY = 'var'
values_KEY = 'values'


#------------------------------------------------------------------------------
def makeEnvVarRowList( valueDict, deviceId, rowsList, idKey ):
    # each received EnvVar type message must have these fields
    if not validDictKey( valueDict, var_KEY ) or \
       not validDictKey( valueDict, values_KEY ):
        logging.error('makeEnvVarRowList: Missing key(s) in dict.')
        return

    varName =   valueDict[ var_KEY ]
    values =    valueDict[ values_KEY ]

    # clean / scrub / check the values.  
    deviceId =  deviceId.replace( '~', '' ) 
    varName =   varName.replace( '~', '' ) 

    # OLD format, we are no longer using exp or treat
    # <expName>~<KEY>~<treatName>~<valName>~<created UTC TS>~<deviceId>

    # NEW temporary format, just until we remove the extra two '~' and fix
    # ALL the queries in the UI and services and data upload scripts.
    # ~<KEY>~~<valName>~<created UTC TS>~<deviceId>
    ID = '~' + idKey + '~~{}~{}~' + deviceId

    row = ( ID.format( varName, 
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() )), # id column
        values ) # values column (no X or Y)

    rowsList.append( row )


#------------------------------------------------------------------------------
def makeRowList( valueDict, deviceId, rowsList ):

    if not validDictKey( valueDict, messageType_KEY ):
        logging.error('Missing key %s' % messageType_KEY )
        return

    if messageType_EnvVar == valueDict[ messageType_KEY ]:
        makeEnvVarRowList( valueDict, deviceId, rowsList, 'Env' )
        return

    if messageType_CommandReply == valueDict[ messageType_KEY ]:
        makeEnvVarRowList( valueDict, deviceId, rowsList, 'Cmd' )
        return

    logging.error('makeRowList: Invalid value {} for key {}'.format(
        valueDict[ messageType_KEY ], messageType_KEY ))

"""
example of the MQTT device telemetry message we receive:

data=b'{"messageType": "CommandReply", "exp": "RobExp", "treat": "RobTreat", "var": "status", "values": "{\\"name\\":\\"rob\\"}"}'
  deviceId=EDU-B90F433E-f4-0f-24-19-fe-88
  subFolder=
  deviceNumId=2800007269922577

"""

#debugrob: should I publish a message type of "Image"?  (base64)
#debugrob:  then handle it here to:
# 1) write base64 image to Datastore Images.
# 2) decode base64 image and save file to bucket.
# 3) write bucket file path as "Env" var to BQ.
# 4) write bucket file path to Datastore ImagePaths. 

#debugrob: need cloud storage function / object
#debugrob: need datastore function / object

#debugrob: is NOW a good time to consider changing JBrain.IoT, UI queries and saved data files and BQ scripts to NOT use Experiment and Treatment fields in the IDs.   Check data doc.


#------------------------------------------------------------------------------
# Insert data into our bigquery dataset and table.
def bq_data_insert( BQ, pydict, deviceId, PROJECT, DS, TABLE ):
    try:
        # Generate the data that will be sent to BigQuery for insertion.
        # Each value must be a row that matches the table schema.
        rowList = []
        makeRowList( pydict, deviceId, rowList )
        rows_to_insert = []
        for row in rowList:
            rows_to_insert.append( row )
        logging.info( "bq insert rows: %s" % ( rows_to_insert ))

        dataset_ref = BQ.dataset( DS, project=PROJECT )
        table_ref = dataset_ref.table( TABLE )
        table = BQ.get_table( table_ref )               

        response = BQ.insert_rows( table, rows_to_insert )
        logging.info( 'bq response: {}'.format( response ))

#debugrob: I need to look up the the user by deviceId, and find their openag flag (or role), to know the correct DS to write to.

        return 

    except Exception as e:
        logging.critical( "bq_data_insert: Exception: %s" % e )




