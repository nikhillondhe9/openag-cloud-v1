#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

#------------------------------------------------------------------------------
# Command line arg processing
if [ $# -lt 2 ]; then
  echo "Please provide the dataset and table to remove data from."
  echo "For example: openag_private_webui user"
  exit 1
fi
DS=$1
TBL=$2

#------------------------------------------------------------------------------
# Remove data from the table.
rm_data $DS $TBL


