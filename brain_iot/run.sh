#!/bin/bash

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

source pyenv/bin/activate
source ../gcloud_env.bash

# MUST use the central region / zone for beta IoT product.
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-c

# Kill service accounts, since for IoT we won't deploy it.
export GOOGLE_APPLICATION_CREDENTIALS=

# Remember to copy over *.pem from ../device-registration/

DEVICE_ID=F82F6792-f4-0f-24-19-fe-88

python3 iot_mqtt_example.py \
   --project_id=$GCLOUD_PROJECT \
   --registry_id=$GCLOUD_DEV_REG \
   --cloud_region=$GCLOUD_REGION \
   --device_id=$DEVICE_ID \
   --algorithm=RS256 \
   --private_key_file=rsa_private.pem \
   --ca_certs=roots.pem \
   --num_messages 0

#   --num_messages 2

#   --log debug \
