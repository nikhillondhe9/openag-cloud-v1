#!/bin/bash

source gcloud_env.bash

#list_ds_and_tables

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


