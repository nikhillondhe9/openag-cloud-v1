#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

if [ $# -eq 0 ]; then
  echo "Please provide the bucket to restore from. For example:"
  echo "gs://openag-cloud-v1-2017-11-27-09-36-31-1511793391"
  exit 1
fi
BUCKET=$1

echo "Restoring data files from $BUCKET"
echo "If the tables are NOT empty, you will insert duplicate data."
echo "Has the schema been created and are tables empty? [y/N]: "
read -n 1 yn
if [[ $yn != "y" && $yn != "Y"  ]]; then
  echo "    >>> Go create/load the schema first.  Exiting."
  exit 1
fi

# Restore all tables 
for DS in "${DATASETS[@]}"; do
  for TBL in "${DATA_TABLES[@]}"; do
    restore_data $DS $TBL $BUCKET
    if [ $? -eq 1 ]; then
      echo "Exiting script."
      exit 1
    fi
  done
done

for TBL in "${UI_TABLES[@]}"; do
  restore_data $WEBUI_DS $TBL $BUCKET
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done

echo "Done restoring!"
