#!/bin/sh

# This script uses a list of requried packages with NO versions.
# It lets pip install the latest version of each package.
# It then updates the requirements.txt that we install when we deploy.

pip install -t lib -r requirements-to-freeze.txt --upgrade && PYTHONPATH=./lib pip freeze > requirements.txt

echo 'Please verify requirements.txt looks sane and commit it.'
