#!/bin/bash

source gcloud_env.bash

echo "You can only ADD columns to a schema, not modify or delete them."

# Function to update a table with an updated schema.
# The first arg is the table name.
update_schema(){
  TBL=$1
  FILE="schema/"
  FILE+=$TBL
  FILE+="_schema.json"
  bq update -t $DATASET.$1 $FILE
  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to update table $TBL schema from $FILE"
    exit 1
  fi
}

# Update all tables in the dataset
update_schema $EXP_TABLE 
update_schema $TRE_TABLE 
update_schema $VAL_TABLE 
update_schema $COM_TABLE 

