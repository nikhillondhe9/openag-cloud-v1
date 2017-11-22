#!/bin/bash

source gcloud_env.bash

bq rm -r -d $DATASET
if [ $? -eq 1 ]; then
  echo "Exiting script, Failed to delete dataset $DATASET"
  exit 1
fi
echo "Dataset $DATASET deleted."

