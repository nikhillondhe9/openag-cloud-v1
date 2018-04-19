#!/bin/bash

# Set up the python 3 virtual env. 

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

rm -fr pyenv

#sudo pip install --upgrade virtualenv
virtualenv --python python3 pyenv
source pyenv/bin/activate

# use "pip freeze" to produce the list of reqs.
pip install -r requirements.txt

