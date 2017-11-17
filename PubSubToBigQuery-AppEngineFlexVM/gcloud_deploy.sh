#!/bin/bash

export GCLOUD_PROJECT=openag-cloud-v1
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-b
export GOOGLE_APPLICATION_CREDENTIALS=../service_account.json

#export GCLOUD_REGISTRY=dev-reg-temp-v1
#export GCLOUD_DEVICE=my-rs256-device
#export GCLOUD_TOPIC=pubsub-topic
#export GCLOUD_SUBS=my-sub

# This next command will open a browser window to verify your google account.
# (what if I have a service_account.json file locally?)
gcloud auth login
gcloud config set project $GCLOUD_PROJECT
gcloud config set compute/region $GCLOUD_REGION
gcloud config set compute/zone $GCLOUD_ZONE
gcloud config list

gcloud app deploy
gcloud app browse

echo "Remember to stop and/or delete this instance in the console if you are just testing!"

#gcloud app instances list
#gcloud app instances ssh --service default --version <ver> <ID>
#gcloud app versions stop <ver>
#gcloud app instances delete --service default --version <ver> <ID>
#open https://console.cloud.google.com/appengine/versions?project=openag-cloud-v1
