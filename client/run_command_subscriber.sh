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

# Load our google project and service account (security) environment variables.
source gcloud_env.bash

# Pass along all the command line args that this script has
python3 command_subscriber.py "$@"
