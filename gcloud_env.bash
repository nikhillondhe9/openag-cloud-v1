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

# PubSub topic and subscription that MQTT telementry 'events' are sent to.
export GCLOUD_DEV_EVENTS=device-events

# IoT device registry
export GCLOUD_DEV_REG=device-registry


