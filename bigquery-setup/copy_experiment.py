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
#
# We first delete what we are going to insert in the destination table 
# (so we don't get duplicate rows - this is the best way to 'replace' data).


#------------------------------------------------------------------------------
# Run a batch query and print the job state after waiting for completion.
def run_batch_query( cli, sql, jobc, to ):
  print( 'Running:', sql )
  query_job = cli.query( sql, job_config=jobc )
  iterator = query_job.result( timeout=to )
  print( query_job.state )


#------------------------------------------------------------------------------
# Dynamically get the list of columns from the table.
def get_columns( cli, ds, table ):
  ds = cli.dataset( ds )    # returns a reference to the DS
  tref = ds.table( table )  # returns a reference to the table
  t = cli.get_table( tref ) # get the full table object from the server's API
  COLS = ""
  for col in t.schema:
    COLS += col.name + ","
  COLS = COLS[:-1] # remove last char, ',' or ' '
  return( COLS )


#------------------------------------------------------------------------------
def main():

  # glorious command line args
  parser = argparse.ArgumentParser()
  parser.add_argument('--experiment', required=True, type=str, \
                      help='Experiment to copy')
  parser.add_argument('--sourceDS', required=True, type=str, \
                      help='Source dataset')
  parser.add_argument('--destDS', required=True, type=str, \
                      help='Destination dataset')
  args = parser.parse_args()

  # Verify the user wants to OVERWRITE the experiment in the DEST DS!
  yn = input( 'Are you sure you want to overwrite experiment ' + 
    args.experiment + ' in the ' + args.destDS + ' dataset? [y/N]: ' )
  if yn.lower() != 'y':
    print( "Exiting", sys.argv[0] )
    exit( 1 )


  # Instantiate a BQ client instance.
  cli = bigquery.Client()

  # Verify the datasets exist
  ds_list = []
  for ds in cli.list_datasets():
    ds_list.append( ds.dataset_id )
  if args.sourceDS not in ds_list:
    print( 'ERROR: {} is not in the list of valid datasets: {}'.format( 
        args.sourceDS, ds_list ))
    exit( 1 )
  if args.destDS not in ds_list:
    print( 'ERROR: {} is not in the list of valid datasets: {}'.format( 
        args.destDS, ds_list ))
    exit( 1 )

  # Verify that the experiment exists
  EQ = (
    '#standardsql \n'
    'SELECT id FROM ' + args.sourceDS + '.exp ' 
    'WHERE REGEXP_EXTRACT(id, r\'[^~]+\') = \'' + args.experiment + '\'' )
  job = cli.query( EQ )
  results_iter = job.result() # access iterator to send query to API
  if 1 != results_iter.total_rows:
    print( 'ERROR: Experiment ' + args.experiment + ' does not exist.' )
    exit( 1 )

  # Use DELETE.format( table ), id must start with <exp>
  DELETE = (
    'DELETE FROM ' + args.destDS + '.{0} '
    ' WHERE STARTS_WITH(id, \'' + args.experiment + '\')' )
  # Use INSERT.format( table, fields ), id must start with <exp>
  INSERT = (
    'INSERT ' + args.destDS + '.{0} ({1}) '
    ' SELECT {1} '
    ' FROM ' + args.sourceDS + '.{0} '
    ' WHERE REGEXP_EXTRACT(id, r\'[^~]+\') = \'' + args.experiment + '\'' )

  # DML for the device table, since its id is only the device name:
  # DEV_DELETE.format( tdev, ttre )
  DEV_DELETE = (
    'DELETE FROM ' + args.destDS + '.{0} '
    ' WHERE id IN '
    ' (SELECT device FROM ' + args.sourceDS + '.{1} '
    '  WHERE REGEXP_EXTRACT(id, r\'[^~]+\') = \'' + args.experiment + '\''
    '  ORDER BY id) ' )
  # DEV_INSERT.format( tdev, dev_columns, ttre )
  DEV_INSERT = (
    'INSERT ' + args.destDS + '.{0} ({1}) '
    ' SELECT {1} '
    ' FROM ' + args.sourceDS + '.{0} '
    ' WHERE id IN '
    ' (SELECT device FROM ' + args.sourceDS + '.{2} ' 
    '  WHERE REGEXP_EXTRACT(id, r\'[^~]+\') = \'' + args.experiment + '\''
    '  ORDER BY id) ' )


  # BQ client instance
  cli = bigquery.Client()

  # Set up a batch job
  job_config = bigquery.QueryJobConfig()
  job_config.use_legacy_sql = False
  TIMEOUT = 30  # in seconds

  # Table names from env vars
  texp = os.getenv("EXP_TABLE")
  ttre = os.getenv("TRE_TABLE")
  tval = os.getenv("VAL_TABLE")
  tcom = os.getenv("COM_TABLE")
  tdev = os.getenv("DEV_TABLE")
  tgcm = os.getenv("GCM_TABLE")
  tmol = os.getenv("MOL_TABLE")

  # Do the deletes, remove records that may be there before we add dupes.
  run_batch_query( cli, DELETE.format( texp ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( ttre ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( tval ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( tcom ), job_config, TIMEOUT )
  run_batch_query( cli, DEV_DELETE.format( tdev, ttre ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( tgcm ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( tmol ), job_config, TIMEOUT )

  # Do the inserts.
  t = texp
  run_batch_query( cli, INSERT.format( t, get_columns( cli, args.destDS, t )), 
                   job_config, TIMEOUT )
  t = ttre
  run_batch_query( cli, INSERT.format( t, get_columns( cli, args.destDS, t )), 
                   job_config, TIMEOUT )
  t = tval
  run_batch_query( cli, INSERT.format( t, get_columns( cli, args.destDS, t )), 
                   job_config, TIMEOUT )
  t = tcom
  run_batch_query( cli, INSERT.format( t, get_columns( cli, args.destDS, t )), 
                   job_config, TIMEOUT )
  run_batch_query( cli, 
    DEV_INSERT.format( tdev, get_columns( cli, args.destDS, tdev ), ttre ), 
      job_config, TIMEOUT )
  t = tgcm
  run_batch_query( cli, INSERT.format( t, get_columns( cli, args.destDS, t )), 
                   job_config, TIMEOUT )
  t = tmol
  run_batch_query( cli, INSERT.format( t, get_columns( cli, args.destDS, t )), 
                   job_config, TIMEOUT )


#------------------------------------------------------------------------------
# Entry point for the script
if __name__ == "__main__":
    main()

