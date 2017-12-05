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
# Function to print out comments (there are 4 types).
#   cli arg is a reference to the BigQuery Client.
#   exp arg is the experiment name.
#   key arg is the key to the parent obj. type: Exp, Tre, Env, Phe
#   treat arg is the treatment name.  pass in ".*" for all treatments.
#   label arg is the name of what is being printed.
def printComments( cli, ds, exp, key, treat, label ):
  # Get all comments for this treat 
  CQ = (
    '#standardsql \n'
    'SELECT '
    '  (SELECT username FROM ' + 
    os.getenv("WEBUI_DS") + '.' + os.getenv("USER_TABLE") + ' WHERE '
    '    id = REGEXP_EXTRACT(c.id, r\"(?:[^\~]*\~){3}([^~]*)\")) '
    '  as username, '
    '  c.text '
    '  FROM ' + ds + '.com as c '
    '  WHERE REGEXP_CONTAINS(c.id, r\"' )
  CQ += exp             # All comments for experiment <exp>
  CQ += "~" + key + "~" # key
  CQ += treat           # for the current treatment
  CQ += "~.*\") "       # ignore userid and timestamp
  CQ += "ORDER BY id"
  for row in cli.query_rows( CQ ): 
    print( label+row.username, row.text, sep=', ' )


#------------------------------------------------------------------------------
def main():

  # glorious command line args
  parser = argparse.ArgumentParser(description='cmd line args')
  parser.add_argument('--showValues', dest='showValues', \
                      action='store_true', help='show all values')
  parser.add_argument('--dataset', type=str, default=os.getenv("DATA_DS"), \
                      help='dataset to use')
  parser.add_argument('--experiment', type=str, \
                      help='show only this experiment')
  args = parser.parse_args()

  # Instantiates a client
  cli = bigquery.Client()

  # Verify the datasets exist
  ds_list = []
  for ds in cli.list_datasets():
    ds_list.append( ds.dataset_id )
  if args.dataset not in ds_list:
    print( 'ERROR: {} is not in the list of valid datasets: {}'.format( 
        args.dataset, ds_list ))
    exit( 1 )

  # Get a list of experiments
  exps = [] # empty list of experiments
  if None == args.experiment:   # show all experiments
    EQ = (
      '#standardsql \n'
      'SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as name '
      'FROM ' + args.dataset + '.' + os.getenv("EXP_TABLE") + ' '
      'ORDER BY id' )
    for row in cli.query_rows( EQ ):
      exps.append( row.name )
  else:                         # only show the experiment the user specified
    # Verify that the experiment exists
    EQ = (
      '#standardsql \n'
      'SELECT id FROM ' + args.dataset + '.' + os.getenv("EXP_TABLE") + ' '
      'WHERE REGEXP_EXTRACT(id, r\'[^~]+\') = \'' + args.experiment + '\'' )
    results_iter = cli.query_rows( EQ )
    results_list = list( results_iter ) # access iterator to send query to API
    if 1 != results_iter.num_results:
      print( 'ERROR: Experiment ' + args.experiment + ' does not exist in '
             'dataset ' + args.dataset )
      exit( 1 )
    exps.append( args.experiment ) # only one exp in our list

  # For each experiment in our list
  for exp in exps:
    print( exp )

    # Get all comments for this exp (using expression subquery)
    printComments( cli, args.dataset, exp, 
        "Exp", ".*", "  Experiment Comment by: " )

    # Get the list of treatments for each exp.
    TQ = (
      '#standardsql \n'
      'SELECT REGEXP_EXTRACT(t.id, r\"(?:[^\~]*\~){1}([^~]*)\") as name, '
      'user.username as username, recipe, device '
      'FROM ' + args.dataset + '.treat as t, '
      '  (SELECT * FROM openag_private_webui.user) as user '
      'WHERE REGEXP_CONTAINS(t.id, r\"^' )
    TQ += exp
    TQ += "\") AND userid = user.id "
    TQ += "ORDER BY t.id "
    for row in cli.query_rows( TQ ):
      treat = row.name
      username = row.username
      recipe = row.recipe
      device = row.device

      if( args.showValues ):
        # Print all values for this exp + treat
        print( "    " + treat, username, recipe, sep=', ' )
        VQ=( '#standardsql \n'
             'CREATE TEMPORARY FUNCTION '
             '  isFloat(type STRING) AS (TRIM(type) = "float"); '
             'CREATE TEMPORARY FUNCTION '
             '  getFloatAsStr(fval FLOAT64, ival INT64, sval STRING) '
             '  AS (CAST( fval AS STRING)); '
             'CREATE TEMPORARY FUNCTION '
             '  isInt(type STRING) AS (TRIM(type) = "int"); '
             'CREATE TEMPORARY FUNCTION '
             '  getIntAsStr(fval FLOAT64, ival INT64, sval STRING) '
             '  AS (CAST( ival AS STRING)); '
             'CREATE TEMPORARY FUNCTION '
             '  isString(type STRING) AS (TRIM(type) = "string"); '
             'CREATE TEMPORARY FUNCTION '
             '  getString(fval FLOAT64, ival INT64, sval STRING) '
             '  AS (TRIM(sval)); '
             'CREATE TEMPORARY FUNCTION '
             '  getValAsStr(type STRING, '
             '    fval FLOAT64, ival INT64, sval STRING)  AS ('
             '    IF( isFloat(type), getFloatAsStr(fval,ival,sval), '
             '      IF( isInt(type), getIntAsStr(fval,ival,sval), '
             '        IF( isString(type), getString(fval, ival, sval), '
             '          NULL)))); '
             'SELECT REGEXP_EXTRACT(id, r"(?:[^\~]*\~){3}([^~]*)") as Name, '
             '  getValAsStr(type,fval,ival,sval) as Value '
             '  FROM ' + args.dataset + '.' + os.getenv("VAL_TABLE") + ' '
             'WHERE REGEXP_CONTAINS(id, r"' )
        VQ += exp
        VQ += "~.*~" # get Exp and Phe and anything else I add values to
        VQ += treat
        VQ += "~.*\") "
        VQ += "  ORDER BY id "
        for row in cli.query_rows( VQ ):
          print( "      Value: " + row.Name, str(row.Value), sep=', ' )

      else:

        # Get count of values for this exp + treat
        VQ = ('#standardsql \n'
              'SELECT COUNT(id) as num '
              'FROM ' + args.dataset + '.' + os.getenv("VAL_TABLE") + ' '
              'WHERE REGEXP_CONTAINS(id, r\"' )
        VQ += exp
        VQ += "~.*~" # get Exp and Phe and anything else I add values to
        VQ += treat
        VQ += "~.*\") "
        numValues = "0" # default
        for row in cli.query_rows( VQ ): # should only be one row
            numValues = str(row.num) # convert int to string
        print( "    " + treat, username, recipe, 
               "numValues="+numValues, sep=', ' )

      # show device details
      if None == device:
        device = ''
      DQ=( '#standardsql \n'
           'SELECT location,type,warehouse,container,rack,tray FROM ' + 
           args.dataset + '.' + os.getenv("DEV_TABLE") + ' '
           'WHERE id = "' + device + '"' )
      for row in cli.query_rows( DQ ):
        print( "      Device: " + device, row.location, row.type, 
          str(row.warehouse) + '.' + str(row.container) + '.' + 
          str(row.rack) + '.' + str(row.tray), sep=' ' )

      # show all comments
      printComments( cli, args.dataset, exp, os.getenv("ID_KEY_TRE"), treat, 
          "      Treatment Comment by: " )

      printComments( cli, args.dataset, exp, os.getenv("ID_KEY_ENV"), treat, 
          "      Environmental Data Comment by: " )

      printComments( cli, args.dataset, exp, os.getenv("ID_KEY_PHE"), treat, 
          "      Phenotypic Expression Comment by: " )

      printComments( cli, args.dataset, exp, os.getenv("ID_KEY_DEV"), treat, 
          "      Device Comment by: " )


#------------------------------------------------------------------------------
# Entry point for the script
if __name__ == "__main__":
    main()


