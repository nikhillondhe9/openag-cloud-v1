#!/bin/bash

# Get the Google root cert
wget -q https://pki.goog/roots.pem

# https://cloud.google.com/iot/docs/how-tos/credentials/keys
# Generate ssh keys for signing
FILE='rsa_cert.pem'
openssl req -x509 -newkey rsa:2048 -days 3650 -keyout rsa_private.pem \
  -nodes -out $FILE -subj "/CN=unused"
openssl ecparam -genkey -name prime256v1 -noout -out ec_private.pem
openssl ec -in ec_private.pem -pubout -out ec_public.pem

# Embed escaped newlines in a single string to represent the key file
KEY=`awk 'NF {sub(/\r/, ""); printf "%s\\\n",$0;}' $FILE`

# Python to generate the checksum we show the user as a "validation code"
CKSUM=`python3 -c "import zlib
fn = \"$FILE\"
with open( fn, 'r' ) as f:
  key_file_contents = f.read()
cksum = zlib.crc32( key_file_contents.encode('utf-8') )
print( '{:X}'.format( cksum ))"`

# Must use " in JSON, hence the funny bash string concatenation for the data
DATA='{"key": "'$KEY'", "cksum": "'$CKSUM'"}'

# POST the data to the firebase cloud function
curl --silent https://us-central1-fb-func-test.cloudfunctions.net/saveKey  -H "Content-Type: application/json" -X POST --data "$DATA"

#debugrob, print a tiny URL to the UI
echo "Please enter this verification code into the UI:"
echo $CKSUM


