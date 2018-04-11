#!/bin/bash

if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

GCLOUD_PROJECT=openag-v1
IOT_SA=service_account.json
GCLOUD_REGION=us-central1
GCLOUD_DEV_REG=device-registry
# this is robs mit mac
DEVICE_ID=EDU-B90F433E-f4-0f-24-19-fe-88

source pyenv/bin/activate

python3 send-iot-config.py \
                   --iot_project $GCLOUD_PROJECT \
                   --iot_service_account $IOT_SA \
                   --region $GCLOUD_REGION \
                   --registry $GCLOUD_DEV_REG \
                   --device_id $DEVICE_ID \
                   --command_1 RESET \
                   --arg0_1 0 \
                   --arg1_1 0 \
                   --command_2 LoadRecipeIntoVariable \
                   --arg0_2 light_control \
                   --arg1_2 '{ "dtype": "4", "measurement_period_ms": "4000", "num_cycles": "1", "curr_cycle": "0", "cycles": [ { "num_steps": "2", "num_repeats": "10", "curr_step": "0", "curr_repeat": "0", "steps": [ { "set_point": "800", "duration": "360" }, { "set_point": "0", "duration": "60" } ] } ] }' \
                   --command_3 AddVariableToTreatment \
                   --arg0_3 0 \
                   --arg1_3 light_control \
                   --command_4 RunTreatment \
                   --arg0_4 0 \
                   --arg1_4 0



