#!/bin/bash

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

export TOP_DIR="${PWD}/../.."
source iot_env/bin/activate
source $TOP_DIR/gcloud_env.bash
source ../iot.bash

PKHASH=`sum ../rsa_cert.pem | cut -d ' ' -f 1`

python3 publish_public_key.py \
  --project_id=$GCLOUD_PROJECT \
  --topic=$GCLOUD_DEV_UNCLAIMED \
  --public_key_file=../rsa_cert.pem \
  --public_key_hash=$PKHASH


#python3 cloudiot_mqtt_example.py \
#   --project_id=$GCLOUD_PROJECT \
#   --registry_id=$GCLOUD_DEV_REG \
#   --cloud_region=$GCLOUD_REGION \
#   --device_id=my-python-device \
#   --algorithm=RS256 \
#   --private_key_file=../rsa_private.pem \
#   --ca_certs=../roots.pem \
#   --num_messages 2
