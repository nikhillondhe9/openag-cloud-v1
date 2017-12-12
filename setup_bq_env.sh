#!/bin/bash

# Set up the python 3 virtual env. and add the python GC modules we use

cd ~/openag-cloud-v1/bigquery-setup
pip install --upgrade virtualenv
virtualenv --python python3 env
source env/bin/activate
pip install --upgrade google-cloud-core
pip install --upgrade google-cloud-bigquery

