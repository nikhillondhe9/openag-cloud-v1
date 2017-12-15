#!/bin/bash

virtualenv --python python3 env
source env/bin/activate
pip install --upgrade google-cloud-core
pip install --upgrade google-api-python-client
pip install --upgrade google-cloud-pubsub
pip install --upgrade gapic-google-cloud-pubsub-v1
pip install pyjwt 

