#!/usr/bin/env python3

# Imports the Google Cloud client library
from google.cloud import bigquery

# authentication seems to work with the env vars if set, or the saved ones in:
# ~/.config/gcloud/configurations/config_default

# Instantiates a client
cli = bigquery.Client()

for ds in cli.list_datasets():
  d = cli.get_dataset( ds ) # get full object
  print( d.dataset_id )
  #print( "  description:", d.description )
  for tbl in cli.list_dataset_tables( ds ):
    t = cli.get_table( tbl ) # get full object
    print( "    table:", t.table_id );
    #print( "      description:", t.description )
    print( "      rows:", t.num_rows )
    print( "      bytes:", t.num_bytes )
    COLS = "      columns: "
    for col in t.schema:
      COLS += col.name + ","
    COLS = COLS[:-1] # remove last char, ',' or ' '
    print( COLS )

