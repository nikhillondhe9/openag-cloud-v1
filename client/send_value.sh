#!/bin/bash

# If there is a current python virtual environment, deactivate it.
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

# Has the user setup the local python environment we need?
if ! [ -d pubsub_env ]; then   
  echo 'ERROR: you have not run one_time_setup.sh'
  exit 1
fi

# Yes, so activate it for this bash process
source pubsub_env/bin/activate

#debugrob: process bash command line args and pass on

python publish.py --value 1
