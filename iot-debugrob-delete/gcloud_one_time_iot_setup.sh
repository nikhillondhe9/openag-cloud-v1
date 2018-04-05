#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi


# Authorize using our service account and local key.
gcloud auth activate-service-account --key-file $GOOGLE_APPLICATION_CREDENTIALS

# MUST use the central region / zone for beta IoT product.
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-c

# The configuration will be saved to:
#   ~/.config/gcloud/configurations/config_default
gcloud config set project $GCLOUD_PROJECT
#gcloud config set compute/region $GCLOUD_REGION
#gcloud config set compute/zone $GCLOUD_ZONE

# Create a topic for unclaimed keys, where a new device publishes their public
# key.
gcloud pubsub topics create $GCLOUD_DEV_UNCLAIMED

# Create device 'event'/data topic
gcloud pubsub topics create $GCLOUD_DEV_EVENTS

# Create a device registry
gcloud beta iot registries create $GCLOUD_DEV_REG \
  --project=$GCLOUD_PROJECT \
  --region=$GCLOUD_REGION \
  --event-pubsub-topic=$GCLOUD_DEV_EVENTS

# See the example_make_keys.sh script for device side key stuff.


echo "Add the service account cloud-iot@system.gserviceaccount.com with the role 'Pub/Sub Publisher' as a member to the IAM permissions for the project in the console."

