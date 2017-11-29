# GCP python3 setup 

## OSX python setup
xcode-select --install
brew install python
brew install python3

## Linux python setup
sudo apt update
sudo apt install python python-dev python3 python3-dev
 
wget https://bootstrap.pypa.io/get-pip.py
sudo python get-pip.py

## Common python BQ and Pub-Sub setup
pip install --upgrade virtualenv
cd ~/openag-cloud-v1
virtualenv --python python3 env
source env/bin/activate
pip install --upgrade google-cloud-core
pip install --upgrade google-cloud-bigquery

#pip install --upgrade google-api-python-client
#pip install --upgrade google-cloud-pubsub
#pip install --upgrade gapic-google-cloud-pubsub-v1

https://cloud.google.com/bigquery/docs/reference/rest/v2/datasets/list

python3 -c "from google.cloud import bigquery; help(bigquery)" > bq-py-docs.txt


