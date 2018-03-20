#!/bin/bash

echo "Enter this verification code in the UI:"
sum rsa_cert.pem | cut -d ' ' -f 1

