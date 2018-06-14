#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Please provide your device verification code on the command line."
    exit 1
fi

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

# this may be needed on machines that don't have gcloud installed/setup (Jake)
export GOOGLE_APPLICATION_CREDENTIALS=$IOT_SA

source pyenv/bin/activate

# NOTE: the notes arg are optional metadata stored in the device registry.

python3 dev-auth.py --fb_service_account $FB_SA \
                    --region $GCLOUD_REGION \
                    --iot_project $GCLOUD_PROJECT \
                    --iot_service_account $IOT_SA \
                    --registry $GCLOUD_DEV_REG \
                    --user_email rbaynes@mit.edu \
                    --verification_code $1 \
                    --notes "$2"


