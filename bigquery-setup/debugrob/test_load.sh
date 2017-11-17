#!/bin/bash

export GCLOUD_PROJECT=openag-cloud-v1
export GOOGLE_APPLICATION_CREDENTIALS=../../service_account.json
export DATASET=test_dataset
export TABLE=test_tbl

bq load --skip_leading_rows=1 \
  --ignore_unknown_values \
  $DATASET.$TABLE ./test_temp_humid.csv ./test_temp_humid.json
