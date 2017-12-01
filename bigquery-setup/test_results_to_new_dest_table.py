#!/usr/bin/env python3

import os, sys, getopt, argparse
from func_lib import ValidEnvForGCP  # Our common functions

if not ValidEnvForGCP():
  print( "Exiting", sys.argv[0] )
  exit( 1 )

from google.cloud import bigquery


#------------------------------------------------------------------------------
# Use a batch job to query a private DS/table and put the results in a 
# public DS and new, automatically created destination table.

QUERY_W_PARAM = (
    'SELECT * '
    'FROM `openag_private_data.exp` '
    'LIMIT 100')
TIMEOUT = 30  # in seconds

cli = bigquery.Client()

# Set up a batch job
job_config = bigquery.QueryJobConfig()
job_config.use_legacy_sql = False
#job_config.default_dataset
#job_config.table_definitions

# Set a destination table.
dest_dataset = cli.dataset( 'openag_foundation_open_phenome' )
#dest_table = dest_dataset.table( 'exp' ) # fails because this table exists
dest_table = dest_dataset.table( 'test_dest_exp' )
job_config.destination = dest_table

query_job = cli.query(
    QUERY_W_PARAM, job_config=job_config)  # API request - starts the query

# wait for the query to finish
iterator = query_job.result(timeout=TIMEOUT)
rows = list(iterator)
for row in rows:
    print(row)

