#!/bin/bash

if [[ -z "${TOP_DIR}" ]]; then
  # gcloud_env.bash has not been sourced.
  export TOP_DIR="${PWD}/.."
  source $TOP_DIR/gcloud_env.bash
fi

# MUST use the central region / zone for beta IoT product.
export GCLOUD_REGION=us-central1
export GCLOUD_ZONE=us-central1-c

# Get Google root cert
wget -q https://pki.goog/roots.pem

# Generate ssh keys for signing
openssl req -x509 -newkey rsa:2048 -days 3650 -keyout rsa_private.pem \
  -nodes -out rsa_cert.pem -subj "/CN=unused"
openssl ecparam -genkey -name prime256v1 -noout -out ec_private.pem
openssl ec -in ec_private.pem -pubout -out ec_public.pem

echo "Enter this verification code in the UI:"
sum rsa_cert.pem | cut -d ' ' -f 1


