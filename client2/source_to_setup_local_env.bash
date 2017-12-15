source env/bin/activate

export GCLOUD_PROJECT=openag-cloud-v1
export GCLOUD_TOPIC=environmental-data
export GOOGLE_APPLICATION_CREDENTIALS=service_account.json


#debugrob: these are different than the east coast reg/zone I use elsewhere
# but that is all the beta iot device registry supports now.
#export GCLOUD_REGION=us-central1
#export GCLOUD_ZONE=us-central1-b

#export GCLOUD_SUBS=values-environmental-data
#export GCLOUD_REGISTRY=brain-boxes
#export GCLOUD_DEVICE=robs-ML-BBB
