#!/bin/bash

export GCLOUD_PROJECT=openag-cloud-v1
export GOOGLE_APPLICATION_CREDENTIALS=../service_account.json
export DATASET=test_dataset

# This next command should automatically authorize this computer to our
# cloud project with the service_account.json credentials (did you remember to
# decrypt it?) If it opens a browser window to verify your google account, 
# something is wrong.
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS --project=$GCLOUD_PROJECT

# Make the dataset (check if it exists first)
bq mk $DATASET
if [ $? -eq 1 ]; then
  echo "Exiting script."
  exit 1
fi

# Create the entire schema
#bq mk -t test_dataset.test_table schema.json

#bq load ds.new_tbl ./info.csv ./info_schema.json
