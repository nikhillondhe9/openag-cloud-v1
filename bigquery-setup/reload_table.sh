#!/bin/bash

source gcloud_env.bash

#------------------------------------------------------------------------------
# Command line arg processing
if [ $# -lt 2 ]; then
  echo "Please provide the dataset and table to reload data to."
  echo "For example: openag_private_data com"
  exit 1
fi
DS=$1
TBL=$2

#------------------------------------------------------------------------------
# Remove data from the table.
rm_data $DS $TBL

#------------------------------------------------------------------------------
# Load the data into table.
load_data $DS $TBL
