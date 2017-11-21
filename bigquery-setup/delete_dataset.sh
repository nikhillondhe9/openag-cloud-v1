#!/bin/bash

source gcloud_env.bash

# This next command should automatically authorize this computer to our
# cloud project with the service_account.json credentials (did you remember to
# decrypt it?) If it opens a browser window to verify your google account, 
# something is wrong.
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS --project=$GCLOUD_PROJECT

bq rm -r -f -d $DATASET
if [ $? -eq 1 ]; then
  echo "Exiting script, Failed to delete dataset $DATASET"
  exit 1
fi
echo "Dataset $DATASET deleted."

