#!/bin/bash

# Set up the python and node environments for local development.

# Get the path to THIS script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

rm -fr $DIR/pyenv $DIR/FlaskApiProvider/lib $DIR/FlaskApiProvider/__pycache__  $DIR/ReactFrontEnd/node_modules

virtualenv --python python3 pyenv
source $DIR/pyenv/bin/activate

cd $DIR/FlaskApiProvider
pip install -t lib -r requirements.txt

cd $DIR/ReactFrontEnd
npm install --save-dev
