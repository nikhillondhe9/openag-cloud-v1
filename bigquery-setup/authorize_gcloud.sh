#!/bin/bash

source gcloud_env.bash

# This next command should automatically authorize this computer to our
# cloud project with the service_account.json credentials (did you remember to
# decrypt it?) If it opens a browser window to verify your google account, 
# something is wrong.
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS --project=$GCLOUD_PROJECT

