#!/bin/bash

# Set up the python 3 virtual env. for the GAE pub sub local env.

cd ~/openag-cloud-v1/PubSubToBigQuery-AppEngineFlexVM
pip install --upgrade virtualenv
virtualenv --python python3 env
source env/bin/activate
pip install --upgrade google-api-python-client
pip install python-dateutil

