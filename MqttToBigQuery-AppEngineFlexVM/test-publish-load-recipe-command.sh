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

# load and run light_control, wait then stop:
./test-publish-command.py --command RESET 
./test-publish-command.py --command LoadRecipeIntoVariable --arg0 "light_control" --arg1 "`cat light_control.json`" 
./test-publish-command.py --command AddVariableToTreatment --arg0 0 --arg1 "light_control" 
./test-publish-command.py --command RunTreatment --arg0 0 
sleep 30
./test-publish-command.py --command Status
sleep 2
./test-publish-command.py --command StopTreatment --arg0 0 



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

