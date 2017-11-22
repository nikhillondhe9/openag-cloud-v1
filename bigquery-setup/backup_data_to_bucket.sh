#!/bin/bash

source gcloud_env.bash

# Function to export data from a table to a storage bucket.
# The first arg is the table name.
export_data(){
  TBL=$1
  BUCKET=gs://$GOOGLE_STORAGE_DATA_BUCKET/$TBL.csv
  bq extract $DATASET.$TBL $BUCKET

  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to export table $TBL to $BUCKET"
    exit 1
  fi
}

# Save all tables 
export_data $EXP_TABLE
export_data $TRE_TABLE
export_data $VAL_TABLE 
export_data $COM_TABLE

echo "Go look at bucket: https://console.cloud.google.com/storage/browser/openag-cloud-v1-data?project=openag-cloud-v1"
