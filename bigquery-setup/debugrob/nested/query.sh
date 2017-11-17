#!/bin/bash

export GCLOUD_PROJECT=openag-cloud-v1
export GOOGLE_APPLICATION_CREDENTIALS=../../service_account.json
export DATASET=test_dataset
export TABLE=nested

bq query "SELECT * FROM [$GCLOUD_PROJECT:$DATASET.$TABLE] order by id asc"
