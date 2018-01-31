#!/bin/bash

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

source pubsub_env/bin/activate
source ../gcloud_env.bash

./test-publish-command.py --command LoadRecipeIntoVariable --arg1 "`cat recipe.json`"
#./test-publish-command.py --command Status

