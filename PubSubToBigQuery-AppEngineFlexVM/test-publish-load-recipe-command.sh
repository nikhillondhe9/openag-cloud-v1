#!/bin/bash

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi

source pubsub_env/bin/activate

# send base64 recipe?
#./test-publish-command.py --command LoadRecipeIntoVariable --arg1 "`cat recipe.json`" --arg2 5000

./test-publish-command.py --command Status

