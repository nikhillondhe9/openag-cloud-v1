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

./test-publish-command.py --command Status



# From brain/docs/commands.md
#
# command: RunTreatment 
#   arg0: treatment id 0 < MAX_NUM_TREATMENTS (4).
#   arg1: 0
# command: StopTreatment 
#   arg0: treatment id 0 < MAX_NUM_TREATMENTS (4).
#   arg1: 0
# command: LoadRecipeIntoVariable 
#   arg0: variable name (depends on hard coded hardware config).
#   arg1: escaped JSON recipe string (about 1.8KB).
# command: AddVariableToTreatment 
#   arg0: treatment id 0 < MAX_NUM_TREATMENTS (4).
#   arg1: variable name (depends on hard coded hardware config).
# command: ExitTreatments 
#   arg0: 0
#   arg1: 0
# command: Status 
#   arg0: 0
#   arg1: 0
# command: NOOP 
#   arg0: 0
#   arg1: 0
# command: RESET 
#   arg0: 0
#   arg1: 0

