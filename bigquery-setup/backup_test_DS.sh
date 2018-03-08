#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

# Make a new storage bucket
BUCKET=gs://$GCLOUD_PROJECT`date "+-backup-%Y-%m-%d-%H-%M-%S-%s"`/
gsutil mb $BUCKET


# Save all tables in the test dataset
DS=$TEST_DS
for TBL in "${DATA_TABLES[@]}"; do
  export_data $DS $TBL $BUCKET
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done


echo "Go look at bucket: $BUCKET"
echo "https://console.cloud.google.com/storage/browser/?project=openag-v1"
