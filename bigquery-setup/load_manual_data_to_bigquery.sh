#!/bin/bash

source gcloud_env.bash

# Function to load data into a table.
# The first arg is the table name.
# The second arg is the data file name (in CSV).
load_data(){
  TBL=$1
  FILE=$2
  bq load --skip_leading_rows=1 \
    --ignore_unknown_values \
    $DATASET.$TBL $FILE

  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to load table $TBL from $FILE"
    exit 1
  fi
}

# Load all tables in the schema
load_data $EXP_TABLE data/experiments.csv
load_data $TRE_TABLE data/treatments.csv
load_data $VAL_TABLE data/values.csv
load_data $COM_TABLE data/comments.csv

