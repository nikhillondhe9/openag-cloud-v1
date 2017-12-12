#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

#------------------------------------------------------------------------------
# User is prompted for confirmation.
for DS in "${DATASETS[@]}"; do
  rm_dataset $DS
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done

rm_dataset $WEBUI_DS
