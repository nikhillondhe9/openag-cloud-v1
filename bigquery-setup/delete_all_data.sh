#!/bin/bash

source gcloud_env.bash

echo "Deleting ALL data from ALL datasets."
echo "Are you SURE??? [y/N]: "
read -n 1 yn
if [[ $yn != "y" && $yn != "Y"  ]]; then
  echo "	>>> Perhaps backup all the data first.  Exiting."
  exit 1
fi

#------------------------------------------------------------------------------
# delete all data from all tables in all DS
for DS in "${DATASETS[@]}"; do
  for TBL in "${DATA_TABLES[@]}"; do
    rm_data $DS $TBL
  done
done

for TBL in "${UI_TABLES[@]}"; do
  rm_data $WEBUI_DS $TBL
done

