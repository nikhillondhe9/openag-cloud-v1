#!/bin/bash

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi

# MUST use the central region / zone for beta IoT product.
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-c

# These env vars live in app.yaml for the gcloud GAE deployed app:
export PROJECT_ID=$GCLOUD_PROJECT
export PUBSUB_TOPIC="projects/$GCLOUD_PROJECT/topics/device-events"
#export BQ_DATASET="test"
#export BQ_TABLE="vals"

source pubsub_env/bin/activate

python mqtt-auth.py
