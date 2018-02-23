#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

#------------------------------------------------------------------------------
# This script assumes that all the status tables have been manually deleted.
#------------------------------------------------------------------------------


mk_schema $WEBUI_DS $STATUS_TABLE "$STATUS_TABLE_DESC" 
if [ $? -eq 1 ]; then
  echo "Exiting script."
  exit 1
fi

#load_data $WEBUI_DS $STATUS_TABLE

