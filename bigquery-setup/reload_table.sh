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

echo "Are you SURE you want to reload $DS $TBL??? [y/N]: "
read -n 1 yn
if [[ $yn != "y" && $yn != "Y"  ]]; then
  echo "	>>> Perhaps backup all the data first.  Exiting."
  exit 1
fi

#------------------------------------------------------------------------------
# Remove data from the table.
rm_data $DS $TBL

#------------------------------------------------------------------------------
# Load the data into table.
load_data $DS $TBL
