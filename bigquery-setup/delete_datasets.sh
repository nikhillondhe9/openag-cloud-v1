#!/bin/bash

source gcloud_env.bash

#------------------------------------------------------------------------------
# User is  prompted for confirmation.
for DS in "${DATASETS[@]}"; do
  rm_dataset $DS
done

rm_dataset $WEBUI_DS
