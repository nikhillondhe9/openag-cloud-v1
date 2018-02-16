#!/bin/bash

# The required BQ and GCP env. vars are in app.yaml (so we can deploy to GAE).

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi

# The env vars we need are in app.yaml for the gcloud GAE deployed app.
# To run locally, we need GOOGLE_APPLICATION_CREDENTIALS from gcloud_env.bash

# We also need these env vars that are set in app.yaml that is not processed
# when run localy:
export PROJECT_ID=${GCLOUD_PROJECT}
export BQ_USER_DATASET=openag_private_webui
export BQ_USER_TABLE=user
export BQ_RECIPE_TABLE=rec
export BQ_CMD_TABLE=cmd

export BQ_DATA_DATASET=test
export BQ_VALUE_TABLE=val

export PUBSUB_TOPIC=projects/openag-cloud-v1/topics/commands

export MEMCACHE_URL=memcached-13909.c1.us-east1-2.gce.cloud.redislabs.com:13909
export MEMCACHE_USERNAME=rbaynes@gmail.com
export MEMCACHE_PASSWORD=Il0veRedis

npm start
