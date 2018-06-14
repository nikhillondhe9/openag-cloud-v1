#!/usr/bin/env python3

""" This file contains some utilities used for processing data and 
    writing data to BigQuery.
"""

import os, time, logging, struct, sys, traceback, base64
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

# keys for messageType='Image'
varName_KEY = 'varName'
imageType_KEY = 'imageType'
chunk_KEY = 'chunk'
totalChunks_KEY = 'totalChunks'
imageChunk_KEY = 'imageChunk'
messageID_KEY = 'messageID'


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

# a packed binary image which contains its name
data=b'pascal-string-length-prefixed-camera-name, then image binary'

# JSON string image env. var.
data=b'{"messageType": "Image", "var": "webcam-top","{'values':[{'name':'URL', 'type':'str', 'value':'https://storage.googleapis.com/openag-v1-images/EDU-E40B8A78-f4-0f-24-19-fe-88_webcam-top_2018-06-13T16%3A20%3A20Z.png'}]}" }'
  deviceId=EDU-B90F433E-f4-0f-24-19-fe-88
  subFolder=
  deviceNumId=2800007269922577

# JSON string command reply
data=b'{"messageType": "CommandReply", "var": "status", "values": "{\\"name\\":\\"rob\\"}"}'
  deviceId=EDU-B90F433E-f4-0f-24-19-fe-88
  subFolder=
  deviceNumId=2800007269922577
"""


#------------------------------------------------------------------------------
# Save the image bytes to a file in cloud storage.
# The cloud storage bucket we are using allows "allUsers" to read files.
# Return the public URL to the file in a cloud storage bucket.
def saveFileInCloudStorage( CS, varName, imageType, imageBytes, 
        deviceId, CS_BUCKET ):

    bucket = CS.bucket( CS_BUCKET )
    filename = '{}_{}_{}.{}'.format( deviceId, varName,
        time.strftime( '%Y-%m-%dT%H:%M:%SZ', time.gmtime() ), imageType )
    blob = bucket.blob( filename )

    content_type = 'image/{}'.format( imageType )

    blob.upload_from_string( imageBytes, content_type=content_type )
    logging.info( "saveFileInCloudStorage: image saved to %s" % \
            blob.public_url )
    return blob.public_url


#------------------------------------------------------------------------------
# Save the URL as an entity in the datastore, so the UI can fetch it.
def saveImageURLtoDatastore( DS, deviceId, publicURL, cameraName ):
    key = DS.key( 'Images' )
    image = datastore.Entity( key, exclude_from_indexes=[] )
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
# Save the URL as an entity in the datastore, so the UI can fetch it.
def saveImageChunkToDatastore( DS, deviceId, messageId, varName, imageType, \
        chunkNum, totalChunks, imageChunk ):
    key = DS.key( 'MqttServiceCache' )
    # string properties are limited to 1500 bytes if indexed, 
    # 1M if not indexed.  
    chunk = datastore.Entity( key, exclude_from_indexes=['imageChunk'] )
    chunk.update( {
        'deviceId': deviceId,
        'messageId': messageId,
        'varName': varName,
        'imageType': imageType,
        'chunkNum': chunkNum,
        'totalChunks': totalChunks,
        'imageChunk': imageChunk,
        'timestamp': datetime.now()
        } )
    DS.put( chunk )  
    logging.debug( 'saveImageChunkToDatastore: saved to MqttServiceCache '
        '{}, {} of {} for {}'.format( 
            messageId, chunkNum, totalChunks, deviceId ))
    return 


#------------------------------------------------------------------------------
# Returns list of dicts, each with a chunk.
def getImageChunksFromDatastore( DS, deviceId, messageId ):
    query = DS.query( kind='MqttServiceCache' )
    query.add_filter( 'deviceId', '=', deviceId )
    query.add_filter( 'messageId', '=', messageId )
    qiter = list( query.fetch() )
    results = list( qiter )
    resultsToReturn = []
    for row in results:
        pydict = {
            'deviceId': row.get( 'deviceId', '' ),
            'messageId': row.get( 'messageId', '' ),
            'varName': row.get( 'varName', '' ),
            'imageType': row.get( 'imageType', '' ),
            'chunkNum': row.get( 'chunkNum', '' ),
            'totalChunks': row.get( 'totalChunks', '' ),
            'imageChunk': row.get( 'imageChunk', '' ) 
        }
        resultsToReturn.append( pydict )
    return resultsToReturn


#------------------------------------------------------------------------------
def deleteImageChunksFromDatastore( DS, deviceId, messageId ):
    query = DS.query( kind='MqttServiceCache' )
    query.add_filter( 'deviceId', '=', deviceId )
    query.add_filter( 'messageId', '=', messageId )
    qiter = query.fetch()
    for entity in qiter:
        #print('debugrob entity={}'.format(entity))
        DS.delete( entity.key )
    logging.debug( "deleteImageChunksFromDatastore: {} deleted.".format( 
        messageId ))
    return


#------------------------------------------------------------------------------
# Parse and save the image
def save_image( CS, DS, BQ, pydict, deviceId, PROJECT, DATASET, TABLE, \
        CS_BUCKET ):

    try:
        if messageType_Image != validateMessageType( pydict ):
            logging.error( "save_image: invalid message type" )
            return

        # each received image message must have these fields
        if not validDictKey( pydict, varName_KEY ) or \
                not validDictKey( pydict, imageType_KEY ) or \
                not validDictKey( pydict, chunk_KEY ) or \
                not validDictKey( pydict, totalChunks_KEY ) or \
                not validDictKey( pydict, imageChunk_KEY ) or \
                not validDictKey( pydict, messageID_KEY ):
            logging.error('save_image: Missing key(s) in dict.')
            return

        messageId =   pydict[ messageID_KEY ]
        varName =     pydict[ varName_KEY ]
        imageType =   pydict[ imageType_KEY ]
        chunkNum =    pydict[ chunk_KEY ]
        totalChunks = pydict[ totalChunks_KEY ]
        imageChunk =  pydict[ imageChunk_KEY ]

        # For every message received, check data store to see if we can
        # assemble chunks.  Messages will probably be received out of order.

        # Start with a list of the number of chunks received:
        listOfChunksReceived = []
        for c in range( 0, totalChunks ):
            listOfChunksReceived.append( False )

        # What chunks have we already received?
        oldChunks = getImageChunksFromDatastore( DS, deviceId, messageId )
        for oc in oldChunks:
            listOfChunksReceived[ oc[ 'chunkNum' ] ] = True

        # Add in the chunk we just got
        listOfChunksReceived[ chunkNum ] = True
        oldChunks.append( {
            'deviceId': deviceId,
            'messageId': messageId,
            'varName': varName,
            'imageType': imageType,
            'chunkNum': chunkNum,
            'totalChunks': totalChunks,
            'imageChunk': imageChunk
        } )

        # Do we have all chunks?
        haveAllChunks = True
        for c in listOfChunksReceived:
            if not c:
                haveAllChunks = False

        # No, so just add this chunk to the datastore and return
        if not haveAllChunks:
            saveImageChunkToDatastore( DS, deviceId, messageId, varName, 
                imageType, chunkNum, totalChunks, imageChunk )
            return

        # YES! We have all our chunks, so reassemble the binary image.

        # Delete the temporary datastore cache for the chunks
        deleteImageChunksFromDatastore( DS, deviceId, messageId )

        # Sort the chunks by chunkNum (we get messages out of order)
        oldChunks = sorted( oldChunks, key=lambda k: k['chunkNum'] )
        b64str = ''
        for oc in oldChunks:
            b64str += oc[ 'imageChunk' ]
            logging.debug( 'save_image: assemble {} of {}'.format( 
                oc[ 'chunkNum' ], oc['totalChunks'] ))
            
        # Now covert our base64 string into binary image bytes
        imageBytes = base64.b64decode( b64str )
        logging.debug( 'save_image: imageBytes size={}'.format( 
            len( imageBytes )))

#debugrob: 
#        logging.critical('debugrob msgID={} chunkNum={} totalChunks={} varName={} imageType={} image-size={}'.format( messageId, chunkNum, totalChunks, varName, imageType, len(imageChunk) ))


        # Put the image bytes in cloud storage as a file, and get an URL
        publicURL = saveFileInCloudStorage( CS, varName, imageType,
            imageBytes, deviceId, CS_BUCKET )
        
        # Put the URL in the datastore for the UI to use.
        saveImageURLtoDatastore( DS, deviceId, publicURL, varName )

        # Put the URL as an env. var in BQ.
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
def save_data( CS, DS, BQ, pydict, deviceId, \
        PROJECT, DATASET, TABLE, CS_BUCKET ):

    if messageType_Image == validateMessageType( pydict ):
        save_image( CS, DS, BQ, pydict, deviceId, PROJECT, DATASET, TABLE, 
                CS_BUCKET )
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




