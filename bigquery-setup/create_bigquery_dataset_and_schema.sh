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

# Make the dataset (check if it exists first)
bq mk $DATASET
if [ $? -eq 1 ]; then
  echo "Exiting script, Does the dataset already exist?"
  exit 1
fi

# Set the description of the dataset
bq update --description "MIT Media Lab, Open Agriculture Initiative, Open Phenome Library.  A public dataset of plant growth and research data."  $DATASET

# Create all tables in the dataset
mk_schema $EXP_TABLE 
mk_schema $TRE_TABLE 
mk_schema $VAL_TABLE 
mk_schema $COM_TABLE 

# Set a description for each table
bq update --description "Experiments, the top level table. Comprised of a set of Treatments to compare against each other."  $DATASET.$EXP_TABLE 
bq update --description "Each Treatment is a run of a Climate Recipe and post harvest results."  $DATASET.$TRE_TABLE 
bq update --description "Values are generic name/value/location objects."  $DATASET.$VAL_TABLE 
bq update --description "Comments can be added to many objects."  $DATASET.$COM_TABLE 
