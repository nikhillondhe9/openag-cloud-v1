#!/usr/bin/env python3

""" This file contains some utilities used for processing data and 
    writing data to BigQuery.
"""

import os, time, logging, struct, sys, traceback
from datetime import datetime
from google.cloud import bigquery
from google.cloud import datastore
from google.cloud import storage


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
def makeBQRowList( valueDict, deviceId, rowsList ):

    messageType = validateMessageType( valueDict )
    if None == messageType:
        return False

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


#debugrob: DO THIS: change UI queries to NOT use Experiment and Treatment fields in the IDs.   Check data ID doc.
#debugrob: use in UI BQ_DATASET: openag_public_user_data


#------------------------------------------------------------------------------
# Create a temp JPG file from the imageBytes.
# Copy the file to cloud storage.
# The cloud storage bucket we are using allows "allUsers" to read files.
# Return the public URL to the JPG file in a cloud storage bucket.
def saveFileInCloudStorage( CS, varName, imageBytes, deviceId, CS_BUCKET ):

    bucket = CS.bucket( CS_BUCKET )
    filename = '{}_{}_{}.jpg'.format( deviceId, varName,
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() ))
    blob = bucket.blob( filename )

    blob.upload_from_string( imageBytes, content_type='image/jpg' )
    logging.info( "saveFileInCloudStorage: image saved to %s" % \
            blob.public_url )
    return blob.public_url


#------------------------------------------------------------------------------
# Save the URL as an entity in the datastore, so the UI can fetch it.
def saveImageURLtoDatastore( DS, deviceId, publicURL, cameraName ):
    key = DS.key( 'Images' )
    image = datastore.Entity(key, exclude_from_indexes=[])
    image.update( {
        'device_uuid': deviceId,
        'URL': publicURL,
        'camera_name': cameraName,
        'creation_date': datetime.now()
        } )
    DS.put( image )  
    logging.debug( "saveImageURLtoDatastore: saved Images entity" )
    return 


#------------------------------------------------------------------------------
# Parse and save the image
def save_image( CS, DS, BQ, dataBlob, deviceId, PROJECT, DATASET, TABLE, 
        CS_BUCKET ):

    try:
        # break the length prefixed name apart from the image data in the blob
        endNameIndex = 101 # 1 byte for pascal string size, 100 chars.
        ba = bytearray( dataBlob ) # need to use a mutable bytearray
        namePacked = bytes( ba[ 0:endNameIndex ] )# slice off first name chars
        namePackedFormatStr = '101p'
        unpackPascalStr = struct.unpack( namePackedFormatStr, namePacked )
        varName = unpackPascalStr[0].decode( 'utf-8' )
        imageBytes = bytes( ba[ endNameIndex: ] ) # rest of array is image data

        publicURL = saveFileInCloudStorage( CS, varName,
            imageBytes, deviceId, CS_BUCKET )
        
        saveImageURLtoDatastore( DS, deviceId, publicURL, varName )

        message_obj = {}
        message_obj['messageType'] = messageType_Image
        message_obj['var'] = varName
        valuesJson = "{'values':["
        valuesJson += "{'name':'URL', 'type':'str', 'value':'%s'}" % \
                            ( publicURL )
        valuesJson += "]}"
        message_obj['values'] = valuesJson
        bq_data_insert( BQ, message_obj, deviceId, PROJECT, DATASET, TABLE )

    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception in save_image(): %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


#------------------------------------------------------------------------------
# Parse and save the (json/dict) data
def save_data( BQ, pydict, deviceId, PROJECT, DATASET, TABLE ):

    if messageType_Image == validateMessageType( pydict ):
        logging.error('save_data: does not handle images.' )
        return 

    # insert into BQ (Env vars and command replies)
    bq_data_insert( BQ, pydict, deviceId, PROJECT, DATASET, TABLE )


#------------------------------------------------------------------------------
# Insert data into our bigquery dataset and table.
def bq_data_insert( BQ, pydict, deviceId, PROJECT, DATASET, TABLE ):
    try:
        # Generate the data that will be sent to BigQuery for insertion.
        # Each value must be a row that matches the table schema.
        rowList = []
        if not makeBQRowList( pydict, deviceId, rowList ):
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




