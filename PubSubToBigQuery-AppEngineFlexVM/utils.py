#!/usr/bin/env python

""" This file contains some utilities used for processing data and 
    writing data to BigQuery.
"""

import collections
import datetime
import time

from apiclient import discovery
import dateutil.parser
import httplib2
from oauth2client.client import GoogleCredentials

SCOPES = ['https://www.googleapis.com/auth/bigquery',
          'https://www.googleapis.com/auth/pubsub']

#debugrob: is this enough retries to insert into BQ?
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
# Insert a list of values into the given BigQuery table.
def bq_data_insert( bigquery, project_id, dataset, table, values ):
    try:
        rowlist = []
        # Generate the data that will be sent to BigQuery for insertion.
        # Each value must be a JSON object that matches the table schema.
        for item in values:
            item_row = {"json": item}
            rowlist.append(item_row)
        body = {"rows": rowlist}
        print( "bq send: %s" % ( body ))

#debugrob: 
# should I build the id here myself, instead of trusting the client to send it?
# this is a "streaming" insert and we can't delete the data for a day.
# I need to validate the user / openag flag, to know the correct DS.

        # Try the insertion.
        response = bigquery.tabledata().insertAll(
                projectId=project_id, datasetId=dataset,
                tableId=table, body=body ).execute( num_retries=NUM_RETRIES )

        #debugrob TODO: 'invalid field' errors can be detected here.

        print( "bq resp: %s %s" % 
            ( datetime.datetime.now(), response ))
        return response
    except Exception as e:
        print( "Giving up: %s" % e )




