#!/bin/bash

# Run the python Flask API locally for development.

# Get the path to THIS script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

source $DIR/pyenv/bin/activate

cd $DIR/FlaskApiProvider
export PYTHONPATH=./lib
export FLASK_APP=main.py
export GOOGLE_APPLICATION_CREDENTIALS=./authenticate.json
export GCLOUD_PROJECT=openag-v1
export GCLOUD_DEV_REG=device-registry
export GCLOUD_REGION=us-central1

python3 -m flask run
