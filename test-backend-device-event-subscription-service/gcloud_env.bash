# All the Google cloud platform env. vars. we use in our scripts.
# Source this in the bash script that runs the python script.

# Get the path to THIS script 
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#------------------------------------------------------------------------------
export GCLOUD_PROJECT=openag-v1

# MUST use the central region / zone for beta IoT product.
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-c

export GOOGLE_APPLICATION_CREDENTIALS=service_account.json

# pub sub topic and subscription that MQTT telementry 'events' are sent to
export GCLOUD_DEV_EVENTS=device-events

