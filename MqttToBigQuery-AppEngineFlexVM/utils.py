#!/usr/bin/env python3

""" This file contains some utilities used for processing data and 
    writing data to BigQuery.
"""

import os, time, logging, tempfile
from google.cloud import bigquery


# should be enough retries to insert into BQ
NUM_RETRIES = 3


# keys common to all messages
messageType_KEY = 'messageType'
messageType_EnvVar = 'EnvVar'
messageType_CommandReply = 'CommandReply'
messageType_Image = 'Image'

# keys for messageType='EnvVar' (and also 'CommandReply')
var_KEY = 'var'
values_KEY = 'values'


#------------------------------------------------------------------------------
def validDictKey( d, key ):
    if key in d:
        return True
    else:
        return False


#------------------------------------------------------------------------------
# returns the messageType key if valid, else None.
def validateMessageType( valueDict ):

    if not validDictKey( valueDict, messageType_KEY ):
        logging.error('Missing key %s' % messageType_KEY )
        return None

    if messageType_EnvVar == valueDict[ messageType_KEY ]:
        return messageType_EnvVar

    if messageType_CommandReply == valueDict[ messageType_KEY ]:
        return messageType_CommandReply

    if messageType_Image == valueDict[ messageType_KEY ]:
        return messageType_Image

    logging.error('validateMessageType: Invalid value {} for key {}'.format(
        valueDict[ messageType_KEY ], messageType_KEY ))
    return None


#------------------------------------------------------------------------------
# Make a BQ row that matches the table schema for the 'vals' table.
# (python will pass only mutable objects (list) by reference)
def makeBQEnvVarRowList( valueDict, deviceId, rowsList, idKey ):
    # each received EnvVar type message must have these fields
    if not validDictKey( valueDict, var_KEY ) or \
       not validDictKey( valueDict, values_KEY ):
        logging.error('makeBQEnvVarRowList: Missing key(s) in dict.')
        return

    varName =   valueDict[ var_KEY ]
    values =    valueDict[ values_KEY ]

    # clean / scrub / check the values.  
    deviceId =  deviceId.replace( '~', '' ) 
    varName =   varName.replace( '~', '' ) 

    # NEW ID format:  <KEY>~<valName>~<created UTC TS>~<deviceId>
    ID = idKey + '~{}~{}~' + deviceId

    row = ( ID.format( varName, 
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() )), # id column
        values ) # values column (no X or Y)

    rowsList.append( row )


#------------------------------------------------------------------------------
# returns True if there are rows to insert into BQ, false otherwise.
#debugrob: no cloud path?  or None for it?
def makeBQRowList( valueDict, deviceId, cloudStoragePath, rowsList ):

    messageType = validateMessageType( valueDict )
    if None == messageType:
        return False

#debugrob: no cloud path?  or None for it?
    # for images, modify the values to have the bucket path
    if messageType_Image == messageType:
        makeBQImageValue( valueDict, cloudStoragePath )

    # write envVars and images (as envVars)
    if messageType_EnvVar == messageType or \
       messageType_Image == messageType:
        makeBQEnvVarRowList( valueDict, deviceId, rowsList, 'Env' )
        return True

    if messageType_CommandReply == messageType:
        makeBQEnvVarRowList( valueDict, deviceId, rowsList, 'Cmd' )
        return True

    return False

"""
example of the MQTT device telemetry message we receive:

data=b'{"messageType": "CommandReply", "exp": "RobExp", "treat": "RobTreat", "var": "status", "values": "{\\"name\\":\\"rob\\"}"}'
  deviceId=EDU-B90F433E-f4-0f-24-19-fe-88
  subFolder=
  deviceNumId=2800007269922577

"""

#debugrob:  then handle it here to:
# 1) write base64 image to Datastore Images.
# 2) decode base64 image and save file to bucket.
# 3) write bucket file path as "Env" var to BQ.
# 4) write bucket file path to Datastore ImagePaths. 

#debugrob: DO THIS: changing JBrain.IoT, UI queries and saved data files and BQ scripts to NOT use Experiment and Treatment fields in the IDs.   Check data ID doc.


#------------------------------------------------------------------------------
# Create a temp JPG file from the imageBytes.
# Copy the file to cloud storage.
# Return the URL to the JPG file in a cloud storage bucket.
def saveFileInCloudStorage( CS, imageBytes, deviceId, CS_BUCKET ):

    bucket = CS.bucket( CS_BUCKET )
    filename = '{}_{}.jpg'.format( deviceId, 
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() ))
    blob = bucket.blob( filename )

    blob.upload_from_string( imageBytes, content_type='image/jpg' )
    return blob.public_url


#------------------------------------------------------------------------------
# Save the bytes in cloud storage and return it's full path, or None for error.
def saveFileInDatastore( DS, fileBase64String, filePath ):
#debugrob: 
# 1) write base64 image to Datastore Images.
# 4) write bucket file path to Datastore ImagePaths. 
    return 

#------------------------------------------------------------------------------
# returns True if there are rows to insert into BQ, false otherwise.
def makeBQImageValue( valueDict, cloudStoragePath ):
#debugrob: fix?
    if messageType_Image != validateMessageType( valueDict ):
        return False

    # write storage bucket file path as "Env" var to BQ.
    valueDict[ values_KEY ] = '{"cloudStoragePath":"' + cloudStoragePath + '"}'
    return True


#------------------------------------------------------------------------------
# Parse and save the image
def save_image( CS, DS, BQ, imageBytes, deviceId, PROJECT, DATASET, TABLE, 
        CS_BUCKET ):

    cloudStoragePath = saveFileInCloudStorage( CS, 
            imageBytes, deviceId, CS_BUCKET )
    print('debugrob: cloudStoragePath={}'.format( cloudStoragePath ))

#debugrob: call the other funcs
#def saveFileInDatastore( DS, fileBase64String, filePath )

#debugrob: fix below
    # insert into BQ (Env vars and command replies)
#    bq_data_insert( BQ, pydict, deviceId, PROJECT, DATASET, TABLE, cloudStoragePath)


#------------------------------------------------------------------------------
# Parse and save the (json/dict) data
def save_data( BQ, pydict, deviceId, PROJECT, DATASET, TABLE ):

    if messageType_Image == validateMessageType( pydict ):
        return 

#debugrob: no cloud path?  or None for it?
    # insert into BQ (Env vars and command replies)
    bq_data_insert( BQ, pydict, deviceId, PROJECT, DATASET, TABLE, cloudStoragePath)


#------------------------------------------------------------------------------
# Insert data into our bigquery dataset and table.
def bq_data_insert( BQ, pydict, deviceId, PROJECT, DATASET, TABLE, cloudStoragePath):
#debugrob: no cloud path?  or None for it?
    try:
        # Generate the data that will be sent to BigQuery for insertion.
        # Each value must be a row that matches the table schema.
        rowList = []
#debugrob: no cloud path?  or None for it?
        if not makeBQRowList( pydict, deviceId, cloudStoragePath, rowList ):
            return False
        rows_to_insert = []
        for row in rowList:
            rows_to_insert.append( row )
        logging.info( "bq insert rows: %s" % ( rows_to_insert ))

        dataset_ref = BQ.dataset( DATASET, project=PROJECT )
        table_ref = dataset_ref.table( TABLE )
        table = BQ.get_table( table_ref )               

        response = BQ.insert_rows( table, rows_to_insert )
        logging.info( 'bq response: {}'.format( response ))

#debugrob: I need to look up the the user by deviceId, and find their openag flag (or role), to know the correct DATASET to write to.

        return True

    except Exception as e:
        logging.critical( "bq_data_insert: Exception: %s" % e )
        return False




