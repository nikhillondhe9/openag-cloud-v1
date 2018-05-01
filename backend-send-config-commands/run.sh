#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Please provide your device ID on the command line."
    exit 1
fi

if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

GCLOUD_PROJECT=openag-v1
IOT_SA=service_account.json
GCLOUD_REGION=us-central1
GCLOUD_DEV_REG=device-registry
# device ID from the commadn line
DEVICE_ID=$1

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
                   --arg0_2 co2_t6713 \
                   --arg1_2 '{ "dtype": "4", "measurement_period_ms": "60000", "num_cycles": "1", "cycles": [ { "num_steps": "1", "num_repeats": "28", "steps": [ { "set_point": "0", "duration": "86400" } ] } ] }' \
                   --command_3 AddVariableToTreatment \
                   --arg0_3 0 \
                   --arg1_3 co2_t6713 \
                   --command_4 RunTreatment \
                   --arg0_4 0 \
                   --arg1_4 0



