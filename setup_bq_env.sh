#!/bin/bash

# Set up the python 3 virtual env. and add the python GC modules we use

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

cd ~/openag-cloud-v1/bigquery-setup
sudo pip install --upgrade virtualenv
virtualenv --python python3 bq_env
source bq_env/bin/activate
pip install --upgrade google-cloud-core
pip install --upgrade google-cloud-bigquery

