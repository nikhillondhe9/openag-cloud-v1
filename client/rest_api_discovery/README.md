# Google REST API
This code dynamically uses the REST API discovery mechanism to build a client based on the name and version of the API.

It is more work than we need to do for our client.  It is simpler to just use the python pubsub client module which does all this internally for us.

Just keeping this code for reference incase I find something that doesn't work in the python pubsub client.

This is what needs to be installed in the one-time-setup.sh for discovery:
* `pip install --upgrade google-api-python-client`
* `pip install python-dateutil`

Put this into the `gcloud_env.bash`:
* `export GCLOUD_REGISTRY=brain-boxes`
* `export GCLOUD_DEVICE=robs-ML-BBB`

