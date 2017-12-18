------------------
#debugrob: 2017-12-15 latest attempt to see if I can just use 
           the device RSA key is used in place of the service account.

Command line device registry setup:
https://wiki.openag.media.mit.edu/users/rbaynes/google_cloud_platform/pub_sub

1. update source_to_setup_local_env.bash with good env var names
source ./update source_to_setup_local_env.bash

2. Use my personal credentials to create the stuff below.
gcloud auth login 
gcloud projects add-iam-policy-binding $GCLOUD_PROJECT --member=serviceAccount:cloud-iot@system.gserviceaccount.com --role=roles/pubsub.publisher

3. Create topic (already exists)
gcloud beta pubsub topics create $GCLOUD_TOPIC

4. Create a subscription (already exists)
gcloud beta pubsub subscriptions create projects/$GCLOUD_PROJECT/subscriptions/$GCLOUD_SUBS --topic=$GCLOUD_TOPIC

5. Create a registry for devices (done!)
gcloud beta iot registries create $GCLOUD_REGISTRY --project=$GCLOUD_PROJECT --region=$GCLOUD_REGION --event-pubsub-topic=projects/$GCLOUD_PROJECT/topics/$GCLOUD_TOPIC

6. View in console:
https://console.cloud.google.com/iot/locations/us-central1/registries/brain-boxes?project=openag-cloud-v1

7. Set up local python3 env
virtualenv --python python3 env
source env/bin/activate
pip install --upgrade google-cloud-core
pip install --upgrade google-api-python-client
pip install --upgrade google-cloud-pubsub
pip install --upgrade gapic-google-cloud-pubsub-v1
pip install pyjwt 

8. Create keys for EACH device.  Can be done anywhere and copied to device.
openssl req -x509 -newkey rsa:2048 -keyout rsa_private.pem -nodes -out rsa_cert.pem

9. Create a GCP device for EACH device. (done)
gcloud beta iot devices create $GCLOUD_DEVICE --project=$GCLOUD_PROJECT --region=$GCLOUD_REGION --registry=$GCLOUD_REGISTRY --public-key path=rsa_cert.pem,type=rs256

10. Checks:
gcloud beta iot registries list --region=$GCLOUD_REGION
gcloud beta iot devices list --registry=$GCLOUD_REGISTRY --region=$GCLOUD_REGION
gcloud beta pubsub subscriptions list

https://console.cloud.google.com/iot/locations/us-central1/registries/openag-cloud-v1?project=openag-cloud-v1

11.  Use pub.py to publish data from the BBB device.
>>>  Still needs service_account.json file to talk to pub-sub api.


===============================================================================
===============================================================================

old stuff from macbook air at home:

The sample pubsub server I'm messing with is in:
~/nodejs-docs-samples/appengine/pubsub

Notes on running it here:
https://wiki.openag.media.mit.edu/users/rbaynes/google_cloud_platform_questions

----
Remember to activate the local per-project virtual python env:

source env/bin/activate

The 'env' dir was created with: virtualenv --python python3 env

If you want to stop using the virtualenv and go back to your global Python, you can deactivate it:

deactivate

----
OSX Setup steps from: https://cloud.google.com/python/setup

xcode-select --install
brew install python 
brew install python3
pip install --upgrade virtualenv
virtualenv --python python3 env
source env/bin/activate
pip install --upgrade google-cloud-core
pip install --upgrade google-api-python-client
pip install --upgrade google-cloud-pubsub
pip install --upgrade gapic-google-cloud-pubsub-v1
pip install pyjwt 

# below doesn't make the sub.py work - there is something wrong and not installed in the virtual env.   DON'T do this part or run subs.py
#pip install pyjwt paho-mqtt cryptography

Enable the IoT API (only need if running subs.py):
https://console.developers.google.com/apis/library/cloudiot.googleapis.com/?project=temp-v1


----
>>> debugrob, do this again, and see if I really need the service account.
>>> I'm hoping the device RSA key is used in place of it.

Make a new service account json file for this project.
https://cloud.google.com/docs/authentication/getting-started

Run this to set up client env: 
    source ./source_to_setup_local_env.bash

gcloud config set project $GCLOUD_PROJECT
gcloud config set compute/region $GCLOUD_REGION
gcloud config set compute/zone $GCLOUD_ZONE
gcloud info
gcloud list


----
One time GCP project setup tasks:

- Create RSA keys:
    openssl req -x509 -newkey rsa:2048 -keyout rsa_private.pem -nodes -out rsa_cert.pem

- Create a registry for devices:
    gcloud beta iot registries create $GCLOUD_REGISTRY --project=$GCLOUD_PROJECT --region=$GCLOUD_REGION --pubsub-topic=projects/$GCLOUD_PROJECT/topics/$GCLOUD_TOPIC

- Create a GCP device for this project (is each PFC a separate device?):
    gcloud beta iot devices create $GCLOUD_DEVICE --project=$GCLOUD_PROJECT --region=$GCLOUD_REGION --registry=$GCLOUD_REGISTRY --public-key path=rsa_cert.pem,type=rs256

- Create a subscription:
    gcloud beta pubsub subscriptions create projects/$GCLOUD_PROJECT/subscriptions/$GCLOUD_SUBS --topic=$GCLOUD_TOPIC

- List gcloud env for this project:
    gcloud beta iot registries list --region=$GCLOUD_REGION
    gcloud beta iot devices list --registry=$GCLOUD_REGISTRY --region=$GCLOUD_REGION
    gcloud beta pubsub subscriptions list


https://console.cloud.google.com/iot/locations/us-central1/registries/openag-cloud-v1?project=openag-cloud-v1


I didn't need to do this:
Each request to the HTTP bridge must include a JSON Web Token (JWT) in the header.
    https://cloud.google.com/iot/docs/how-tos/credentials/jwts
It looks like HTTP pub sub is only for PUBLISHING?  Don't see any way to subscribe.
    Here is the REST API:
    https://cloud.google.com/iot/docs/reference/rest/



----
So, pub sub works finally, with certs.   Not sure if it is MQTT or HTTP, I 
suspect HTTP under the covers for v1 api.

I had to use the v1 api directly, the top level 'pubsub' does not have a way
to subscribe / pull() messages.

My messages also end up in the message list on one of the two instances
of the test Node app:  https://temp-v1.appspot.com/

Use sub_v1.py for now, can switch to 'official' API later.
Use pub.py to publish data on the device.

NOTE: message order is NOT guaranteed, so I must do my own ordering on the 
receiver if it is important (commands to the PFC, but don't care for DB).

Look at how PlantOS is using pub-sub. Some good config/logging/class ideas.



