## Command line script to add a device to the registry by verification code.

debugrob: also associate the device with a user.

### Programatically add a device to the registry:
`https://cloud.google.com/iot/docs/how-tos/devices#creating_a_device_registry_with_multiple_pubsub_topics`


# MUST use the central region / zone for beta IoT product.
#export GCLOUD_REGION=us-central1
#export GCLOUD_ZONE=us-central1-c

# Register a device
# (does this have to happen on the device? or is it something the server side
# does as part of a dev. reg. process)
#gcloud beta iot devices create my-python-device \
#  --project=$GCLOUD_PROJECT \
#  --region=$GCLOUD_REGION \
#  --registry=$GCLOUD_DEV_REG \
#  --public-key path=rsa_cert.pem,type=rs256
