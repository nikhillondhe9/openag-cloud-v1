#!/bin/bash

# One time firebase function projection initialization.  
# Only needed to deploy the project from a developers machine.

# This is the firebase project that is created in the console
#   https://console.firebase.google.com
PROJECT='fb-func-test'

npm install -g firebase-tools

firebase login

firebase use --add $PROJECT

cd functions
npm install

