#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

#------------------------------------------------------------------------------
# Command line arg processing
if [ $# -lt 2 ]; then
  echo "Please provide the dataset and table to update."
  echo "For example: openag_private_webui user"
  exit 1
fi
DS=$1
TABLE=$2
echo "You can only ADD columns to a schema, not modify or delete them."

#------------------------------------------------------------------------------
# Update the schema of the table the user specified on the command line:
update_schema $DS $TABLE

