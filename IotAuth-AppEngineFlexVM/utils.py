#!/usr/bin/env python3

""" This file contains some utilities used for processing data and 
    writing data to BigQuery.
"""

import os, collections, datetime, time, logging

from apiclient import discovery
import dateutil.parser
import httplib2
from oauth2client.client import GoogleCredentials

#debugrob: will need to add fire/datastore (and fireauth) ?
SCOPES = ['https://www.googleapis.com/auth/pubsub']

# Check for the latest API versions here:
# https://developers.google.com/api-client-library/python/apis/
PS_API='pubsub'
PS_API_VER='v1beta2'


#------------------------------------------------------------------------------
# Get the Google credentials needed to access our services.
def get_credentials():
    credentials = GoogleCredentials.get_application_default()
    if credentials.create_scoped_required():
        credentials = credentials.create_scoped( SCOPES )
    return credentials


#------------------------------------------------------------------------------
# Build the pubsub client.
def create_pubsub_client( credentials ):
    http = httplib2.Http()
    credentials.authorize(http)
    return discovery.build( PS_API, PS_API_VER, http=http )





