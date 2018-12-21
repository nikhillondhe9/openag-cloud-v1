#!/bin/bash

# Get the path to THIS script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#------------------------------------------------------------------------------
export GCLOUD_PROJECT=openag-v1
export GCLOUD_REGION=us-east1
export GCLOUD_ZONE=us-east1-b
export GOOGLE_APPLICATION_CREDENTIALS=$DIR/service_account.json
export GCLOUD_DEV_EVENTS=device-events
export GCLOUD_DEV_REG=device-registry
# MUST use the central region / zone for beta IoT product.
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-c

# Authorize using our service account and local key.
gcloud auth activate-service-account --key-file $GOOGLE_APPLICATION_CREDENTIALS

# The configuration will be saved to:
#   ~/.config/gcloud/configurations/config_default
gcloud config set project $GCLOUD_PROJECT
gcloud config set compute/region $GCLOUD_REGION
gcloud config set compute/zone $GCLOUD_ZONE
gcloud config list

gcloud app deploy

#gcloud app open-console
#gcloud app instances list
#gcloud app instances ssh --service default --version <ver> <ID>
#gcloud app versions list --hide-no-traffic
#gcloud app versions stop <ver>
#gcloud app instances delete --service default --version <ver> <ID>
