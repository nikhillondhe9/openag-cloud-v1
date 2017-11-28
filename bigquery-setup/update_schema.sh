#!/bin/bash

source gcloud_env.bash

list_ds_and_tables

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

