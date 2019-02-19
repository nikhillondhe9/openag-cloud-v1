#!/bin/bash

# Set up the python and node environments for local development.

# Get the path to THIS script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

# Install on linux or darwin operating system
if [[ "$OSTYPE" == "linux"* || "$OSTYPE" == "darwin"* ]]; then

    # Check if python (3.6) is installed
    INSTALL_PATH=`which python3.6`
    if [[ ! -f "$INSTALL_PATH" ]]; then
        echo "Error: python3.6 is not installed, please go install it."
        exit 1
    fi

# Invalid operating system
else
  echo "Error: unsupported operating system: $OSTYPE"
  exit 1
fi


rm -fr $DIR/pyenv $DIR/FlaskApiProvider/lib $DIR/FlaskApiProvider/__pycache__  $DIR/ReactFrontEnd/node_modules

# Create virtual environment
python3.6 -m venv $DIR/pyenv

# Activate the py virtual env
source $DIR/pyenv/bin/activate

cd $DIR/FlaskApiProvider
pip install -t lib -r requirements.txt

cd $DIR/ReactFrontEnd
npm install --save
