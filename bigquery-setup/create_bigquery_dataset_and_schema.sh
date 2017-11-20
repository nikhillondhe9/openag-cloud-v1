#!/bin/bash

source gcloud_env.bash

mk_schema(){
  FILE=$1
  FILE+="_schema.json"
  bq mk -t $DATASET.$1 $FILE
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

