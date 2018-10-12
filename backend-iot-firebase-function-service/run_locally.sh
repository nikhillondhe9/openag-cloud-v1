#!/bin/bash

# Just for local development & testing.

# Command line POST of fake key to local server:
# curl http://localhost:5000/fb-func-test/us-central1/saveKey  -H "Content-Type: application/json" -X POST --data '{"key": "rob", "cksum": "1", "MAC":"and cheese"}'

cd functions
npm run serve


# To test deployed server:
# curl https://us-central1-fb-func-test.cloudfunctions.net/saveKey -H "Content-Type: application/json" -X POST --data '{"key": "IamTheKeyMaster", "cksum": "1", "MAC":"and cheese"}'
