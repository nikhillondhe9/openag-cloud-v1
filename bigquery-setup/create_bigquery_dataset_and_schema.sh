#!/bin/bash

source gcloud_env.bash

# Function to create a table with a schema.
# The first arg is the table name.
mk_schema(){
  TBL=$1
  FILE="schema/"
  FILE+=$TBL
  FILE+="_schema.json"
  bq mk -t $DATASET.$1 $FILE
  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to create table $TBL from $FILE"
    exit 1
  fi
}

# This next command should automatically authorize this computer to our
# cloud project with the service_account.json credentials (did you remember to
# decrypt it?) If it opens a browser window to verify your google account, 
# something is wrong.
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS --project=$GCLOUD_PROJECT

# Make the dataset (check if it exists first)
bq mk $DATASET
if [ $? -eq 1 ]; then
  echo "Exiting script, Does the dataset already exist?"
  exit 1
fi

# Create all tables in the schema
mk_schema $EXP_TABLE 
mk_schema $TRE_TABLE 
mk_schema $VAL_TABLE 
mk_schema $COM_TABLE 

