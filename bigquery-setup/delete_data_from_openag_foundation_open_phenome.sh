#!/bin/bash
if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

sh delete_data.sh $PUBLIC_DATA_DS $EXP_TABLE
sh delete_data.sh $PUBLIC_DATA_DS $TRE_TABLE
sh delete_data.sh $PUBLIC_DATA_DS $VAL_TABLE
sh delete_data.sh $PUBLIC_DATA_DS $COM_TABLE
sh delete_data.sh $PUBLIC_DATA_DS $DEV_TABLE
sh delete_data.sh $PUBLIC_DATA_DS $GCM_TABLE
sh delete_data.sh $PUBLIC_DATA_DS $MOL_TABLE
