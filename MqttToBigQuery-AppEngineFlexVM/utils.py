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

#debugrob: wasn't required before when using insertAll
    # NOTE: X, Y not being sent from device, so use defaults
#    schemaDict[ 'X' ] = 0
#    schemaDict[ 'Y' ] = 0
#    schemaDict[ 'X' ] = '0'
#    schemaDict[ 'Y' ] = '0'

#debugrob: test something simple, no deviceid
    schemaDict[ 'id' ] = expName + '~' + idKey 
    schemaDict[ 'values' ] = 'val'
    schemaDict[ 'X' ] = '0'
    schemaDict[ 'Y' ] = '0'

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


"""
example of what we receive:

data=b'{"messageType": "CommandReply", "deviceId": "EDU-B90F433E-f4-0f-24-19-fe-88", "exp": "RobExp", "treat": "RobTreat", "var": "status", "values": "{\\"name\\":\\"rob\\"}"}'
  deviceId=EDU-B90F433E-f4-0f-24-19-fe-88
  subFolder=
  deviceNumId=2800007269922577

"""

#------------------------------------------------------------------------------
# Insert data into our bigquery dataset and table.
def bq_data_insert( BQ, pydict, deviceId, PROJECT, DS, TABLE ):
    try:

#debugrob also see ~/openag-cloud-v1/bigquery-setup/copy_experiment.py for BATCH inserts

        # Generate the data that will be sent to BigQuery for insertion.
        # Each value must be a JSON object that matches the table schema.
        envVarList = []
        tmpEnvVars = []

        # process the data here to make it table schema compatible
        makeDict( pydict, tmpEnvVars )

        if 0 < len( tmpEnvVars ):
            for envVar in tmpEnvVars:
                item_row = {"json": envVar}
                envVarList.append( item_row )

        if 0 < len( envVarList ):
            rows_to_insert = {"rows": envVarList}
            logging.info( "bq sending vars: %s" % ( rows_to_insert ))

        dataset_ref = BQ.dataset( DS, project=PROJECT )
        table_ref = dataset_ref.table( TABLE )
        table = BQ.get_table( table_ref )               
        response = BQ.insert_rows( table, rows_to_insert )

        logging.info( 'bq resp: {}'.format( response ))

#debugrob: I need to validate the user / openag flag, to know the correct DS.

        return 

    except Exception as e:
        logging.critical( "bq_data_insert: Exception: %s" % e )




