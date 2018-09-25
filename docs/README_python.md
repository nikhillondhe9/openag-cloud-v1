# GCP python3 setup 

## OSX python setup
```
xcode-select --install
brew install python
brew install python3
```

## Linux python setup
```
sudo apt update
sudo apt-get upgrade
sudo apt install python python-dev python3 python3-dev
 
wget https://bootstrap.pypa.io/get-pip.py
sudo python get-pip.py
```

## Set up the environment for BigQuery 
```
cd ~/openag-cloud-v1
./setup_bq_env.sh
```

[BQ dataset REST API](https://cloud.google.com/bigquery/docs/reference/rest/v2/datasets/list)

```
python3 -c "from google.cloud import bigquery; help(bigquery)" > bq-py-docs.txt
```


