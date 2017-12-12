#!/bin/bash

source gcloud_env.bash

# This only needs to be run one time, or if you switch users / service accounts.
# The account will be saved to ~/.config/gcloud/configurations/config_default

# This next command should automatically authorize this computer to our
# cloud project with the service_account.json credentials (did you remember to
# decrypt it?) If it opens a browser window to verify your google account, 
# something is wrong.
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS --project=$GCLOUD_PROJECT


