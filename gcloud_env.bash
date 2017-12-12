# All the Google cloud platform env. vars. we use in our scripts.
# Meant to be sourced in our bash scripts.

# Set TOP_DIR if it isn't set.
if [[ -z "${TOP_DIR}" ]]; then
  export TOP_DIR=${PWD}
fi

#------------------------------------------------------------------------------
export GCLOUD_PROJECT=openag-cloud-v1
# gcloud compute regions list
export GCLOUD_REGION=us-east1
# gcloud compute zones list
export GCLOUD_ZONE=us-east1-b
export GOOGLE_APPLICATION_CREDENTIALS=$TOP_DIR/service_account.json
export GOOGLE_STORAGE_DATA_BUCKET=openag-cloud-v1-data

#export GCLOUD_REGISTRY=dev-reg-temp-v1
#export GCLOUD_DEVICE=my-rs256-device
#export GCLOUD_TOPIC=pubsub-topic
#export GCLOUD_SUBS=my-sub


