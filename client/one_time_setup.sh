#!/bin/bash

# Set up the python 3 virtual env. for the python modules we need.

# Deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

# Install python 3, if on Linux.
# If on some other OS, go do it yourself (see ../README_python.md).
if [[ "$OSTYPE" == "linux"* ]]; then 
    echo 'Installing python3, prompting for your password with sudo...'
    sudo apt install python python-dev python3 python3-dev
elif ! type python3 >/dev/null 2>&1; then 
    echo 'ERROR: we need python3, go install it.'
    exit 1
fi
 
# Make sure we have pip installed
if ! type pip >/dev/null 2>&1; then 
    echo 'Installing pip using sudo (may prompt for your password)...'
    wget https://bootstrap.pypa.io/get-pip.py
    sudo python get-pip.py
fi


echo 'Please be patient, on a BBB this may take 30 min.'
echo 'May prompt for your password with sudo...'
sudo pip install --upgrade pip
sudo pip install --upgrade virtualenv
virtualenv --python python3 pubsub_env
source pubsub_env/bin/activate
pip install --upgrade google-cloud-pubsub
deactivate

