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

# These env vars live in app.yaml for the gcloud GAE deployed app:
export PROJECT_ID=$GCLOUD_PROJECT
export PUBSUB_TOPIC="projects/openag-cloud-v1/topics/environmental-data"
export BQ_DATASET="test"
export BQ_TABLE="vals"
export BQ_USER_DATASET="openag_private_webui"
export BQ_STATUS_TABLE="status"
export BQ_COMMAND_TABLE="cmd"

source pubsub_env/bin/activate

python pubsub-to-bigquery.py
