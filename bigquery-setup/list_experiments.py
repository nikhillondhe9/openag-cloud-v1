#!/usr/bin/env python3

import os, sys, getopt, argparse
from func_lib import ValidEnvForGCP  # Our common functions

# Is our env set up? (check before importing GC modules)
if not ValidEnvForGCP():
  print( "Exiting", sys.argv[0] )
  exit( 1 )

# Imports the Google Cloud client library
from google.cloud import bigquery

# authentication seems to work with the env vars if set, or the saved ones in:
# ~/.config/gcloud/configurations/config_default


#------------------------------------------------------------------------------
def main():

  parser = argparse.ArgumentParser()
  parser.add_argument('--dataset', type=str, default=os.getenv("DATA_DS"), \
    help='dataset')
  args = parser.parse_args()

  cli = bigquery.Client()

  # Get a list of experiments
  EQ = (
    '#standardsql \n'
    'SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as name '
    'FROM ' + args.dataset + '.' + os.getenv("EXP_TABLE") + ' '
    'ORDER BY id' )
  job = cli.query( EQ )
  results_iter = job.result() # access iterator to send query to API
  for row in results_iter:
    exp = row.name 
    print( exp )


#------------------------------------------------------------------------------
# Entry point for the script
if __name__ == "__main__":
    main()


