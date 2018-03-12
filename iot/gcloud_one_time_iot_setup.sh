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

# Create device registration topic
gcloud pubsub topics create $GCLOUD_DEV_EVENTS

# Create a device registry
gcloud beta iot registries create $GCLOUD_DEV_REG \
  --project=$GCLOUD_PROJECT \
  --region=$GCLOUD_REGION \
  --event-pubsub-topic=$GCLOUD_DEV_EVENTS

# Generate ssh keys for signing
openssl req -x509 -newkey rsa:2048 -days 3650 -keyout rsa_private.pem \
  -nodes -out rsa_cert.pem -subj "/CN=unused"
openssl ecparam -genkey -name prime256v1 -noout -out ec_private.pem
openssl ec -in ec_private.pem -pubout -out ec_public.pem

# Register a device
# (does this have to happen on the device? or is it something the server side
# does as part of a dev. reg. process)
gcloud beta iot devices create my-python-device \
  --project=$GCLOUD_PROJECT \
  --region=$GCLOUD_REGION \
  --registry=$GCLOUD_DEV_REG \
  --public-key path=rsa_cert.pem,type=rs256


