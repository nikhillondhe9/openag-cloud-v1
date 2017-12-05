# GCP python3 setup 

## OSX python setup
```bash
xcode-select --install
brew install python
brew install python3
```

## Linux python setup
```bash
sudo apt update
sudo apt install python python-dev python3 python3-dev
 
wget https://bootstrap.pypa.io/get-pip.py
sudo python get-pip.py
```

## Common python BQ and Pub-Sub setup
```bash
cd ~/openag-cloud-v1
pip install --upgrade virtualenv
virtualenv --python python3 env
source env/bin/activate
pip install --upgrade google-cloud-core
pip install --upgrade google-cloud-bigquery
```

[BQ dataset REST API](https://cloud.google.com/bigquery/docs/reference/rest/v2/datasets/list)

```bash
python3 -c "from google.cloud import bigquery; help(bigquery)" > bq-py-docs.txt
```


