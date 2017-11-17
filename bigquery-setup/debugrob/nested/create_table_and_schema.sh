#!/bin/bash

export GCLOUD_PROJECT=openag-cloud-v1
export GOOGLE_APPLICATION_CREDENTIALS=../../../service_account.json
export DATASET=test_dataset

bq mk -t $GCLOUD_PROJECT:$DATASET.nested schema.json
