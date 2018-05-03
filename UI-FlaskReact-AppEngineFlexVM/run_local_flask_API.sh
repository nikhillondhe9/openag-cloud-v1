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

export consumer_key='FdGiou6z8drUL39eqg6Hn1iPV'
export consumer_secret='k2l8yfWlTBi94Sog1vwU1GLwYVOa1n3Nx6jHhgTKpWJvZB6RBS'
export access_token='988446389066719232-6qseNlFGS8rvgGZhfCsMJ0KBz65vc4p'
export access_secret='CrmXb11uawZHjEfXNyJz4nZl6pIWKxCe0rY1mU7oN2R9X'

python3 -m flask run
