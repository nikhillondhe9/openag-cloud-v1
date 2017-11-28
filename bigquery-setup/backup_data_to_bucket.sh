#!/bin/bash

source gcloud_env.bash

# Make a new storage bucket
BUCKET=gs://$GCLOUD_PROJECT`date "+-backup-%Y-%m-%d-%H-%M-%S-%s"`/
gsutil mb $BUCKET


# Save all tables 
for DS in "${DATASETS[@]}"; do
  for TBL in "${DATA_TABLES[@]}"; do
    export_data $DS $TBL $BUCKET
    if [ $? -eq 1 ]; then
      echo "Exiting script."
      exit 1
    fi
  done
done

for TBL in "${UI_TABLES[@]}"; do
  export_data $WEBUI_DS $TBL $BUCKET
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done


echo "Go look at bucket: $BUCKET"
echo "https://console.cloud.google.com/storage/browser/openag-cloud-v1-data?project=openag-cloud-v1"
