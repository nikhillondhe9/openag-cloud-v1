#!/usr/bin/env python3

#debugrob, just a test / hack script.  delete later.

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
"""
other notes say to use: configuration.query.allowLargeResults

and: configuration.query.destinationTable
  [Optional] Describes the table where the query results should be stored. If not present, a new table will be created to store the results. This property must be set for large results that exceed the maximum response size.
"""


#------------------------------------------------------------------------------
"""
debugrob, from this link: 
https://cloud.google.com/bigquery/docs/python-client-migration

### old client code
client = bigquery.Client()
query_job = client.run_async_query(str(uuid.uuid4()), query)

# Use standard SQL syntax.
query_job.use_legacy_sql = False

# Set a destination table.
dest_dataset = client.dataset(dest_dataset_id)
dest_table = dest_dataset.table(dest_table_id)
query_job.destination = dest_table

# Allow the results table to be overwritten.
query_job.write_disposition = 'WRITE_TRUNCATE'

query_job.begin()
query_job.result()  # Wait for query to finish.

rows = query_job.query_results().fetch_data()
for row in rows:
    print(row)


### new code:
QUERY_W_PARAM = (
    'SELECT name, state '
    'FROM `bigquery-public-data.usa_names.usa_1910_2013` '
    'WHERE state = @state '
    'LIMIT 100')
TIMEOUT = 30  # in seconds
param = bigquery.ScalarQueryParameter('state', 'STRING', 'TX')
job_config = bigquery.QueryJobConfig()
job_config.query_parameters = [param]
query_job = client.query(
    QUERY_W_PARAM, job_config=job_config)  # API request - starts the query
assert query_job.state == 'RUNNING'

# Waits for the query to finish
iterator = query_job.result(timeout=TIMEOUT)
rows = list(iterator)
for row in rows:
    print(row)
"""

#------------------------------------------------------------------------------
#debugrob: don't need to do this?  
# Create temporary destination table to hold the results of the query

#debugrob, hack here
QUERY_W_PARAM = (
    'SELECT * '
    'FROM `openag_private_data.exp` '
    'LIMIT 100')
TIMEOUT = 30  # in seconds
job_config = bigquery.QueryJobConfig()
job_config.use_legacy_sql = False
#job_config.default_dataset
#job_config.table_definitions
job_config.destination = "query_results_table"
query_job = cli.query(
    QUERY_W_PARAM, job_config=job_config)  # API request - starts the query
assert query_job.state == 'RUNNING'

# Waits for the query to finish
iterator = query_job.result(timeout=TIMEOUT)
rows = list(iterator)
for row in rows:
    print(row)



"""
  # Get a list of experiments
  EQ = "#standardsql \n"\
       "SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as name "\
       "FROM openag_private_data.exp "\
       "ORDER BY id"
  for row in cli.query_rows( EQ ):
    exp = row.name 
    print( exp )

    # Get all comments for this exp (using expression subquery)
    printComments( cli, exp, "Exp", ".*", "  Experiment Comment by: " )

    # Get the list of treatments for each exp.
    TQ = "#standardsql \n"\
         "SELECT REGEXP_EXTRACT(t.id, r\"(?:[^\~]*\~){1}([^~]*)\") as name, "\
         "user.username as username, recipe, device "\
         "FROM openag_private_data.treat as t, "\
         "  (SELECT * FROM openag_private_webui.user) as user "\
         "WHERE REGEXP_CONTAINS(t.id, r\"^"
    TQ += exp
    TQ += "\") AND userid = user.id "\
         "ORDER BY t.id "
    for row in cli.query_rows( TQ ):
      treat = row.name
      username = row.username
      device = row.device
      recipe = row.recipe

      if( args.showValues ):
        # Print all values for this exp + treat
        print( "    " + treat, username, device, recipe, sep=', ' )
        VQ = "#standardsql \n"\
             "CREATE TEMPORARY FUNCTION "\
             "  isFloat(type STRING) AS (TRIM(type) = 'float'); "\
             "CREATE TEMPORARY FUNCTION "\
             "  getFloatAsStr(fval FLOAT64, ival INT64, sval STRING) "\
             "  AS (CAST( fval AS STRING)); "\
             "CREATE TEMPORARY FUNCTION "\
             "  isInt(type STRING) AS (TRIM(type) = 'int'); "\
             "CREATE TEMPORARY FUNCTION "\
             "  getIntAsStr(fval FLOAT64, ival INT64, sval STRING) "\
             "  AS (CAST( ival AS STRING)); "\
             "CREATE TEMPORARY FUNCTION "\
             "  isString(type STRING) AS (TRIM(type) = 'string'); "\
             "CREATE TEMPORARY FUNCTION "\
             "  getString(fval FLOAT64, ival INT64, sval STRING) "\
             "  AS (TRIM(sval)); "\
             "CREATE TEMPORARY FUNCTION "\
             "  getValAsStr(type STRING, "\
             "    fval FLOAT64, ival INT64, sval STRING)  AS ("\
             "    IF( isFloat(type), getFloatAsStr(fval,ival,sval), "\
             "      IF( isInt(type), getIntAsStr(fval,ival,sval), "\
             "        IF( isString(type), getString(fval, ival, sval), "\
             "          NULL)))); "\
             "SELECT REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){3}([^~]*)\") as Name, "\
             "  getValAsStr(type,fval,ival,sval) as Value "\
             "  FROM openag_private_data.val "\
             "WHERE REGEXP_CONTAINS(id, r\""
        VQ += exp
        VQ += "~.*~" # get Exp and Phe and anything else I add values to
        VQ += treat
        VQ += "~.*\") "
        VQ += "  ORDER BY id "
        for row in cli.query_rows( VQ ):
          print( "      Value: " + row.Name, str(row.Value), sep=', ' )
      else:
        # Get count of values for this exp + treat
        VQ = "#standardsql \n"\
             "SELECT COUNT(id) as num "\
             "FROM openag_private_data.val "\
             "WHERE REGEXP_CONTAINS(id, r\""
        VQ += exp
        VQ += "~.*~" # get Exp and Phe and anything else I add values to
        VQ += treat
        VQ += "~.*\") "
        numValues = "0" # default
        for row in cli.query_rows( VQ ): # should only be one row
            numValues = str(row.num) # convert int to string
        print( "    " + treat, username, device, recipe, 
               "numValues="+numValues, sep=', ' )

      # Get all comments for this treat 
      printComments( cli, exp, "Tre", treat, 
          "      Treatment Comment by: " )

      # Get all comments for this env 
      printComments( cli, exp, "Env", treat, 
          "      Environmental Data Comment by: " )

      # Get all comments for this phenotypic expression 
      printComments( cli, exp, "Phe", treat, 
          "      Phenotypic Expression Comment by: " )
"""



