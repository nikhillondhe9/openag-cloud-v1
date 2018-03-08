#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  echo "ERROR: gcloud_env.bash has not been sourced."
  exit 1
fi
source $TOP_DIR/bigquery-setup/bq_env.bash

#------------------------------------------------------------------------------
# Create only the test dataset.
DS=$TEST_DS
DESC=$TEST_DS_DESC
mk_dataset $DS "$DESC"
if [ $? -eq 1 ]; then
  echo "Exiting script."
  exit 1
fi

# Create all DATA tables for the DATA dataset. (diff tables for webui)
TCOUNT=${#DATA_TABLES[@]}
let TCOUNT-=1
for T in `seq 0 $TCOUNT`; do
  TBL=${DATA_TABLES[ $T ]}
  DESC=${DATA_TABLE_DESCS[ $T ]}
  mk_schema $DS $TBL "$DESC" 
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done

# Load saved data
#for TBL in "${DATA_TABLES[@]}"; do
#  load_data $DS $TBL
#  if [ $? -eq 1 ]; then
#    echo "Exiting script."
#    exit 1
#  fi
#done

