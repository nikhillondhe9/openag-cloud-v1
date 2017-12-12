#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi

# This next command will open a browser window to verify your google account.
# Only needed if the GOOGLE_APPLICATION_CREDENTIALS env. var. isn't set.
#gcloud auth login

# Authorize using our service account and local key.
gcloud auth activate-service-account --key-file $GOOGLE_APPLICATION_CREDENTIALS

# The configuration will be saved to:
#   ~/.config/gcloud/configurations/config_default
gcloud config set project $GCLOUD_PROJECT
gcloud config set compute/region $GCLOUD_REGION
gcloud config set compute/zone $GCLOUD_ZONE
gcloud config list

gcloud app deploy
#gcloud app browse

echo "Remember to stop and/or delete this instance in the console if you are just testing!"


#gcloud app open-console

#gcloud app instances list
#gcloud app instances ssh --service default --version <ver> <ID>

#gcloud app versions list --hide-no-traffic
#gcloud app versions stop <ver>
#gcloud app instances delete --service default --version <ver> <ID>
