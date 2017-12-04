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
def run_batch_query( cli, sql, jobc, to ):
  print( 'Running:', sql )
  query_job = cli.query( sql, job_config=jobc )
  iterator = query_job.result( timeout=to )
  print( query_job.state )

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

#debugrob, add an "Are you sure, this will overwrite experiment <E> in the <destDS>?  [y/N] "

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
  results_iter = cli.query_rows( EQ )
  results_list = list( results_iter ) # access iterator to send query to API
  if 1 != results_iter.num_results:
    print( 'ERROR: Experiment ' + args.experiment + ' does not exist.' )
    exit( 1 )

  # Use DELETE.format( table )
  DELETE = (
    'DELETE FROM ' + args.destDS + '.{0} '
    'WHERE STARTS_WITH(id, \'' + args.experiment + '\')' )
  # Use INSERT.format( table, fields )
  INSERT = (
    'INSERT ' + args.destDS + '.{0} ({1}) '
    'SELECT {1} '
    'FROM ' + args.sourceDS + '.{0} '
    'WHERE REGEXP_EXTRACT(id, r\'[^~]+\') = \'' + args.experiment + '\'' )


  cli = bigquery.Client()

  # Set up a batch job
  job_config = bigquery.QueryJobConfig()
  job_config.use_legacy_sql = False
  TIMEOUT = 30  # in seconds

  # Do the deletes, remove records that may be there before we add dupes.
  run_batch_query( cli, DELETE.format( 'exp' ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( 'treat' ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( 'val' ), job_config, TIMEOUT )
  run_batch_query( cli, DELETE.format( 'com' ), job_config, TIMEOUT )

  # Do the inserts.
  run_batch_query( cli, INSERT.format( 'exp', 'id,userid,startd,endd' ),
    job_config, TIMEOUT )
  run_batch_query( cli, INSERT.format( 'treat', 'id,userid,recipe,device,'
    'startd,endd,species,cultivar,seed,netn,growthtech' ), job_config, TIMEOUT )
  run_batch_query( cli, INSERT.format( 'val', 'id,type,sval,ival,fval,X,Y' ),
    job_config, TIMEOUT )
  run_batch_query( cli, INSERT.format( 'com', 'id,rating,text' ),
    job_config, TIMEOUT )




#------------------------------------------------------------------------------
# Entry point for the script
if __name__ == "__main__":
    main()

