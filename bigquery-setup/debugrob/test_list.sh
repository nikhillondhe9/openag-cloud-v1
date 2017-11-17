#!/bin/bash

export GCLOUD_PROJECT=openag-cloud-v1
export GOOGLE_APPLICATION_CREDENTIALS=../../service_account.json
export DATASET=test_dataset
export TABLE=test_tbl

bq ls $GCLOUD_PROJECT:$DATASET

bq head -n 5 $GCLOUD_PROJECT:$DATASET.$TABLE
