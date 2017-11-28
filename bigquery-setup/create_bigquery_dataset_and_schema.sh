#!/bin/bash

source gcloud_env.bash

#------------------------------------------------------------------------------
# Create all (data) datasets.
DSCOUNT=${#DATASETS[@]}
let DSCOUNT-=1
for N in `seq 0 $DSCOUNT`; do
  DS=${DATASETS[ $N ]}
  DESC=${DATASET_DESCS[ $N ]}
  mk_dataset $DS "$DESC"

  # Create all DATA tables for the DATA dataset. (diff tables for webui)
  TCOUNT=${#DATA_TABLES[@]}
  let TCOUNT-=1
  for T in `seq 0 $TCOUNT`; do
    TBL=${DATA_TABLES[ $T ]}
    DESC=${DATA_TABLE_DESCS[ $T ]}
    mk_schema $DS $TBL "$DESC" 
  done
done

#------------------------------------------------------------------------------
# Create the webui dataset. (it has different tables than the others)
mk_dataset $WEBUI_DS "$WEBUI_DS_DESC"

# Create all webui tables in this dataset.
TCOUNT=${#UI_TABLES[@]}
let TCOUNT-=1
for T in `seq 0 $TCOUNT`; do
  TBL=${UI_TABLES[ $T ]}
  DESC=${UI_TABLE_DESCS[ $T ]}
  mk_schema $WEBUI_DS $TBL "$DESC" 
done

