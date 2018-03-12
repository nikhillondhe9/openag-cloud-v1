#!/bin/bash

# Set up the python 3 virtual env. 

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

cd ~/openag-cloud-v1/iot/mqtt_ex
#sudo pip install --upgrade virtualenv
virtualenv --python python3 iot_env
source iot_env/bin/activate
pip install -r requirements.txt

