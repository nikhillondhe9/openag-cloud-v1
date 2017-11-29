#!/usr/bin/env python3

# Imports the Google Cloud client library
from google.cloud import bigquery

# authentication seems to work with the env vars if set, or the saved ones in:
# ~/.config/gcloud/configurations/config_default

# Instantiates a client
cli = bigquery.Client()

# Get a list of experiments
EQ = "#standardsql \n"\
     "SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as name "\
     "FROM openag_private_data.exp "\
     "ORDER BY id"
for row in cli.query_rows( EQ ):
  exp = row.name 
  print( exp )

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

    # Get count of values for this exp + treat
    VQ = "#standardsql \n"\
         "SELECT COUNT(id) as num "\
         "FROM openag_private_data.val "\
         "WHERE REGEXP_CONTAINS(id, r\""
    VQ += exp
    VQ += "~Env~"
    VQ += treat
    VQ += "~.*\") "
    numValues = "0"
    for row in cli.query_rows( VQ ):
        numValues = str(row.num)

    print( "  " + treat, username, device, recipe, 
          "numValues="+numValues, sep=',' )


