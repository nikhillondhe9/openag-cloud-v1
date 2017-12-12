#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi

# These env vars live in app.yaml for the gcloud GAE deployed app:
export PROJECT_ID=$GCLOUD_PROJECT
export PUBSUB_TOPIC="projects/openag-cloud-v1/topics/test-topic"
export BQ_DATASET="openag_public_user_data"
export BQ_TABLE="val"
export PUBSUB_VERIFICATION_TOKEN="SpaceLettuce123"

python pubsub-to-bigquery.py
