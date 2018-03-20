# All the Google cloud platform env. vars. we use in our scripts.
# Meant to be sourced in our bash scripts.

# Set TOP_DIR if it isn't set.
if [[ -z "${TOP_DIR}" ]]; then
  export TOP_DIR=${PWD}
fi

#------------------------------------------------------------------------------
export GCLOUD_PROJECT=openag-v1
# gcloud compute regions list
export GCLOUD_REGION=us-east1
# gcloud compute zones list
export GCLOUD_ZONE=us-east1-b
export GOOGLE_APPLICATION_CREDENTIALS=$TOP_DIR/service_account.json

# for data
export GCLOUD_TOPIC=environmental-data
export GCLOUD_SUBS=values-environmental-data

# both a topic and a subscription
export GCLOUD_CMDS=commands

# for IoT device registration
export GCLOUD_DEV_UNCLAIMED=device-unclaimed-keys
export GCLOUD_DEV_EVENTS=device-events
export GCLOUD_DEV_REG=device-registry


