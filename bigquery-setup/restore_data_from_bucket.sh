#!/bin/bash

source gcloud_env.bash

# Function to restore data to a table from a storage bucket.
# The first arg is the table name.
restore_data(){
  TBL=$1
  BUCKET=gs://$GOOGLE_STORAGE_DATA_BUCKET/$TBL.csv
  bq load --skip_leading_rows=1 \
    --ignore_unknown_values \
    $DATASET.$TBL $BUCKET

  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to load table $TBL from $BUCKET"
    exit 1
  fi
}

# Save all tables 
restore_data $EXP_TABLE
restore_data $TRE_TABLE
restore_data $VAL_TABLE 
restore_data $COM_TABLE

