#!/bin/bash

echo "Run the following commands in your bash shell:"
echo ""

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    echo "deactivate"
fi

echo "source PubSubToBigQuery-AppEngineFlexVM/pubsub_env/bin/activate"
echo "source gcloud_env.bash"
echo "cd PubSubToBigQuery-AppEngineFlexVM"
echo ""

