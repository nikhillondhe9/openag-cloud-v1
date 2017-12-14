#!/bin/bash

# Set up the python 3 virtual env. for the GAE pub sub local env.

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

cd ~/openag-cloud-v1/PubSubToBigQuery-AppEngineFlexVM
pip install --upgrade virtualenv
virtualenv --python python3 pubsub_env
source pubsub_env/bin/activate
pip install --upgrade google-api-python-client
pip install python-dateutil

