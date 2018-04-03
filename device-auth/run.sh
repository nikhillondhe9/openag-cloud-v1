#!/bin/bash

if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

# firebase only runs in this region while its in beta
GCLOUD_REGION=us-central1

# Firebase project key
FB_SA=fb-func-test-service-account.json

# IoT key are registry for our openag-v1 project
IOT_SA=../service_account.json
GCLOUD_DEV_REG=device-registry
# this is the GCP project 
GCLOUD_PROJECT=openag-v1

source pyenv/bin/activate

python3 dev-auth.py --fb_service_account $FB_SA \
                    --region $GCLOUD_REGION \
                    --iot_project $GCLOUD_PROJECT \
                    --iot_service_account $IOT_SA \
                    --registry $GCLOUD_DEV_REG \
                    --user_email rbaynes@mit.edu \
                    --verification_code $1


