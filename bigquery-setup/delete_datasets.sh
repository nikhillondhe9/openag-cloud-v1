#!/bin/bash

source gcloud_env.bash

#------------------------------------------------------------------------------
# User is  prompted for confirmation.
for DS in "${DATASETS[@]}"; do
  rm_dataset $DS
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done

rm_dataset $WEBUI_DS
