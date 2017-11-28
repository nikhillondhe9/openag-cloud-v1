#!/bin/bash

# Function library for Google BigQuery and Cloud Storage scripts.
# This file should be sourced (inside) or after gcloud_env.bash.

#------------------------------------------------------------------------------
# Function to create a dataset and set its description.
# The first arg is the dataset name.
# The second arg is the dataset description.
mk_dataset(){
  DS=$1 # dataset name
  DESC="$2" # description

  # Make the dataset (check if it exists first)
  bq mk $DS
  if [ $? -eq 1 ]; then
    echo "Exiting script, Does the dataset $DS already exist?"
    exit 1
  fi

  # Set the description of the dataset
  bq update --description "$DESC" $DS
} 


#------------------------------------------------------------------------------
# Function to create a table with a schema.
# The first arg is the dataset name.
# The second arg is the table name.
# The third arg is the table description.
mk_schema(){
  DS=$1 # dataset name
  TBL=$2 # table name
  DESC="$3" # table description
  FILE="schema/"
  FILE+=$TBL
  FILE+="_schema.json"

  # Create a table with a schema.
  bq mk -t $DS.$TBL $FILE
  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to create table $DS.$TBL from $FILE"
    exit 1
  fi

  # Set a description for the table.
  bq update --description "$DESC" $DS.$TBL 
}


#------------------------------------------------------------------------------
# Function to load data into a table.
# The first arg is the dataset name.
# The second arg is the table name.
load_data(){
  DS=$1 # dataset name
  TBL=$2 # table name
  FILE=data/$TBL.csv
  echo "Loading $FILE into $DS.$TBL..."
  bq load --skip_leading_rows=1 \
    --ignore_unknown_values \
    --nodebug_mode \
    $DS.$TBL $FILE

  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to load table $TBL from $FILE"
    exit 1
  fi
}


#------------------------------------------------------------------------------
# Function to display datasets and their tables.
list_ds_and_tables(){
  echo "List of all known datasets and tables:"
  DSCOUNT=${#DATASETS[@]}
  let DSCOUNT-=1
  for N in `seq 0 $DSCOUNT`; do
    DS=${DATASETS[ $N ]}
    TCOUNT=${#DATA_TABLES[@]}
    let TCOUNT-=1
    for T in `seq 0 $TCOUNT`; do
      TBL=${DATA_TABLES[ $T ]}
      echo "	$DS  $TBL"
    done
  done

  TCOUNT=${#UI_TABLES[@]}
  let TCOUNT-=1
  for T in `seq 0 $TCOUNT`; do
    TBL=${UI_TABLES[ $T ]}
    echo "	$WEBUI_DS  $TBL"
  done
}


#------------------------------------------------------------------------------
# Function to update a table with an updated schema.
# The first arg is the dataset name.
# The second arg is the table name.
update_schema(){
  DS=$1
  TBL=$2
  FILE="schema/"
  FILE+=$TBL
  FILE+="_schema.json"
  bq update -t $DS.$TBL $FILE
  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to update table $DS.$TBL schema from $FILE"
    exit 1
  fi
}


#------------------------------------------------------------------------------
# Function to export schema and data from a table to a storage bucket.
# The first arg is the dataset name.
# The second arg is the table name.
# The third arg is the bucket name.
export_data(){
  DS=$1
  TBL=$2
  BUCKET=$3
  DEST=$BUCKET/$DS.$TBL.csv

  # Save the data as a CSV file to the bucket.
  bq extract $DS.$TBL $DEST
  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to export table $DS.$TBL to $DEST"
    exit 1
  fi

  # Dump and copy the schema of the table to the bucket.
  FILE=$DS.$TBL.schema.json 
  bq show --format=prettyjson $DS.$TBL > $FILE
  gsutil cp $FILE $BUCKET
  rm $FILE
}

#------------------------------------------------------------------------------
# Function to restore data to a table from a storage bucket.
# The first arg is the dataset name.
# The second arg is the table name.
# The third arg is the bucket name.
restore_data(){
  DS=$1
  TBL=$2
  BUCKET=$3
  SOURCE=$BUCKET/$DS.$TBL.csv
  echo "Restoring data from $SOURCE..."

  bq load --skip_leading_rows=1 \
    --ignore_unknown_values \
    $DS.$TBL $SOURCE

  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to load table $DS.$TBL from $SOURCE"
    exit 1
  fi
}


#------------------------------------------------------------------------------
# Function to remove all data from a table.
# The first arg is the dataset name.
# The second arg is the table name.
rm_data(){
  DS=$1 # dataset name
  TBL=$2 # table name
  DML="DELETE FROM \`$GCLOUD_PROJECT.$DS.$TBL\` WHERE true"
  echo "Removing all data from $DS.$TBL..."

  bq query --use_legacy_sql=false "$DML"
  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to execute '$DML'"
    exit 1
  fi
}


#------------------------------------------------------------------------------
# Function to remove a dataset. (User is prompted to verify)
# The first arg is the dataset name.
rm_dataset(){
  DS=$1 # dataset name

  bq rm -r -d $DS
  if [ $? -eq 1 ]; then
    echo "Exiting script, Failed to delete dataset $DS"
    exit 1
  fi
  echo "Dataset $DS deleted."
} 


