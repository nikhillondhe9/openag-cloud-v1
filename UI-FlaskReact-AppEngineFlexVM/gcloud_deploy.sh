#!/bin/bash

# Get the path to THIS script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# MUST use the central region for beta IoT product.
export GOOGLE_APPLICATION_CREDENTIALS=$DIR/FlaskApiProvider/authenticate.json
export GCLOUD_PROJECT=openag-v1
export GCLOUD_DEV_REG=device-registry
export GCLOUD_REGION=us-central1

# Authorize using our service account and local key.
gcloud auth activate-service-account --key-file $GOOGLE_APPLICATION_CREDENTIALS

# The configuration will be saved to:
#   ~/.config/gcloud/configurations/config_default
gcloud config set project $GCLOUD_PROJECT
gcloud config set compute/region $GCLOUD_REGION

cd $DIR/FlaskApiProvider
gcloud app deploy

cd $DIR/ReactFrontEnd
gcloud app deploy

echo "Remember to stop and/or delete this instance in the console if you are just testing!"

# To see logs:
#gcloud app logs tail -s flaskapi


#gcloud app browse
#gcloud app open-console

#gcloud app instances list
#gcloud app instances ssh --service default --version <ver> <ID>

#gcloud app versions list --hide-no-traffic
#gcloud app versions stop <ver>
#gcloud app instances delete --service default --version <ver> <ID>
