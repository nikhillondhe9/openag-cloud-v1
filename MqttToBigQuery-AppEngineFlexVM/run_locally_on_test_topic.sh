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

# All env vars live in app.yaml for the gcloud GAE deployed app.

# PubSub topic and subscription that MQTT telementry 'events' are sent to.
# This is a special test-only subscription that a test client writes to.
# ONLY used for debugging a locally running service with one client.
export GCLOUD_DEV_EVENTS=device-test

# BigQuery dataset and table we write to.
export BQ_DATASET="test"
#export BQ_DATASET="openag_public_user_data"

export BQ_TABLE="vals"

export CS_BUCKET="openag-v1-test-images"
#export CS_BUCKET="openag-v1-images"


# Has the user setup the local python environment we need?
if ! [ -d pyenv ]; then
  echo 'ERROR: you have not run ./local_development_one_time_setup.sh'
  exit 1
fi

# Yes, so activate it for this bash process
source pyenv/bin/activate

# Pass along all the command line args that this script has (--log debug)
#python3 mqtt-to-bigquery.py --log info
python3 mqtt-to-bigquery.py --log debug
#python3 mqtt-to-bigquery.py "$@"
