#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

#------------------------------------------------------------------------------
# This script assumes that all the dev tables have been manually deleted.
#------------------------------------------------------------------------------

# create the dev table for each DS
DSCOUNT=${#DATASETS[@]}
let DSCOUNT-=1
for N in `seq 0 $DSCOUNT`; do
  DS=${DATASETS[ $N ]}

  mk_schema $DS $DEV_TABLE "$DEV_TABLE_DESC" 
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi

done


# load the dev table in our private DS
load_data $DATA_DS $DEV_TABLE

