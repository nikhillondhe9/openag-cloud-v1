#!/bin/bash

# Set up the python 3 virtual env. for the python modules we need.

# Deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

# Make sure we have python 3, if on Linux, then install it if not found.
# If on some other OS, go do it yourself (see ../README_python.md).
if ! type python3 >/dev/null 2>&1; then 
    if [[ "$OSTYPE" == "linux"* ]]; then 
        echo 'Installing python3, prompting for your password with sudo...'
        sudo apt install python python-dev python3 python3-dev
    else
        echo 'ERROR: we need python3, go install it.'
        exit 1
    fi
fi
 
# Make sure we have pip installed
if ! type pip >/dev/null 2>&1; then 
    echo 'Installing pip...'
    wget https://bootstrap.pypa.io/get-pip.py
    sudo python get-pip.py
fi

sudo pip install --upgrade virtualenv
virtualenv --python python3 pubsub_env
source pubsub_env/bin/activate
pip install --upgrade google-api-python-client
pip install python-dateutil
deactivate

