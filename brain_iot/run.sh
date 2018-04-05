#!/bin/bash

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

source pyenv/bin/activate
source ../gcloud_env.bash

FILE='rsa_private.pem'
if [ ! -f $FILE ]; then
    echo "Error: The $FILE file needs to be in the current directory."
    exit 1
fi

# MUST use the central region / zone for beta IoT product.
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-c

# Kill service accounts, since for IoT we won't deploy it.
export GOOGLE_APPLICATION_CREDENTIALS=

# Remember to copy over *.pem from ../device-registration/

DEVICE_ID=$1

python3 iot_mqtt_example.py \
   --project_id=$GCLOUD_PROJECT \
   --registry_id=$GCLOUD_DEV_REG \
   --cloud_region=$GCLOUD_REGION \
   --device_id=$DEVICE_ID \
   --algorithm=RS256 \
   --private_key_file=$FILE \
   --ca_certs=roots.pem \
   --num_messages 0

#   --num_messages 2

#   --log debug \
