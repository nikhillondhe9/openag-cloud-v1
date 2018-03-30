#!/bin/bash

if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

GCLOUD_PROJECT=openag-v1
IOT_SA=service_account.json
GCLOUD_REGION=us-central1
GCLOUD_DEV_REG=device-registry

source pyenv/bin/activate

python send-iot-config.py \
                   --iot_project $GCLOUD_PROJECT \
                   --iot_service_account $IOT_SA \
                   --region $GCLOUD_REGION \
                   --registry $GCLOUD_DEV_REG \
                   --device_id F82F6792-f4-0f-24-19-fe-88


