#!/usr/bin/env python3

import os, sys, getopt, argparse
from func_lib import ValidEnvForGCP  # Our common functions

if not ValidEnvForGCP():
  print( "Exiting", sys.argv[0] )
  exit( 1 )

from google.cloud import bigquery

#------------------------------------------------------------------------------
# Use a batch job to query a private DS/table and INSERT the results in a 
# public DS and existing destination table.
# We first delete what we are going to insert in the destination table 
# (so we don't get duplicate rows - this is the best way to 'replace' data).

TIMEOUT = 30  # in seconds

# Delete data in the destination DS/table - to avoid duplicate rows.
DELETE = (
  'DELETE FROM openag_foundation_open_phenome.exp WHERE id IN '
  '  (SELECT id FROM openag_private_data.exp)' )

# Insert data in the destination that is read from the source.
# Column names must be specified for INSERT.
INSERT = (
  'INSERT openag_foundation_open_phenome.exp (id,userid,startd,endd) '
  '  SELECT id,userid,startd,endd FROM openag_private_data.exp' )

cli = bigquery.Client()

# Set up a batch job
job_config = bigquery.QueryJobConfig()
job_config.use_legacy_sql = False

# Do the delete, remove records that may be there before we add dupes.
query_job = cli.query( DELETE, job_config=job_config )  # starts the query
iterator = query_job.result( timeout=TIMEOUT ) # wait for the query to finish

# Do the insert.
query_job = cli.query( INSERT, job_config=job_config )  # starts the query
iterator = query_job.result( timeout=TIMEOUT ) # wait for the query to finish
print( query_job.state )
