#!/bin/bash

# Set up the python 3 virtual env. for the GAE pub sub local env.

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

rm -fr pyenv

#sudo pip install --upgrade virtualenv
virtualenv --python python3 pyenv
source pyenv/bin/activate

pip install --upgrade google-api-python-client
pip install --upgrade google-auth
pip install --upgrade google-auth-httplib2

pip install --upgrade firebase-admin
pip install --upgrade google-cloud-firestore

