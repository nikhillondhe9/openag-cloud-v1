#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi


# Authorize using our service account and local key.
gcloud auth activate-service-account --key-file $GOOGLE_APPLICATION_CREDENTIALS

# The configuration will be saved to:
#   ~/.config/gcloud/configurations/config_default
gcloud config set project $GCLOUD_PROJECT
gcloud config set compute/region $GCLOUD_REGION
gcloud config set compute/zone $GCLOUD_ZONE

# Create all the PubSub "global/system" topics and subscriptions we will need.
# They don't change and are used by all components of our system.
# for data
gcloud pubsub topics create $GCLOUD_TOPIC
gcloud pubsub subscriptions create --topic $GCLOUD_TOPIC $GCLOUD_SUBS

# topic and subscription name match
gcloud pubsub topics create $GCLOUD_REG
gcloud pubsub subscriptions create --topic $GCLOUD_REG $GCLOUD_REG


# SOON: per-device command topic/subscription that are created by the UI.
# Name format: <$GCLOUD_CMDS>_<deviceId>

# TEMPORARY everyone-uses-the-same-topic for commands.
gcloud pubsub topics create $GCLOUD_CMDS
gcloud pubsub subscriptions create --topic $GCLOUD_CMDS $GCLOUD_CMDS


gcloud pubsub topics list

gcloud pubsub topics list-subscriptions $GCLOUD_CMDS


# sample to create topic, subscription, publish message and receive it:
#gcloud pubsub topics create myTopic
#gcloud pubsub subscriptions create --topic myTopic mySubscription
#gcloud pubsub topics publish myTopic --message "hello"
#gcloud pubsub subscriptions pull --auto-ack mySubscription
# also deletes all the subscriptions of the topic:
#gcloud pubsub topics delete myTopic

