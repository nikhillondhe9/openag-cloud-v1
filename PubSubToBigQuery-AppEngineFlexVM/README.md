# openag-cloud-v1 PubSub VM
GCP App Engine Flex env project to subscribe to a PubSub topic, validate the data and batch insert it into BigQuery.

To deploy this app:

    ./gcloud_deploy.sh

# debugrob, WIP
* One time setup to run locally:
```
cd ~/openag-cloud-v1/
./setup_pubsub_env.sh
```

* Enable the GC and PubSub environment so you can run locally:
```
./activate_pubsub_env.sh
./run_locally.sh
```

* Manually send a message with the web console
  * [https://console.cloud.google.com/cloudpubsub/topics/test-topic?project=openag-cloud-v1](our topic and subscription)
  * Try typing JSON into the Message (must use double quotes in console): 
    * ` {"data": "hello"} `
    * ` {"id": "expName~KEY~treatName~valName~UTC", "type": "float", "fval": "2.34", "X": "1", "Y": "3"} `
    * ` {"id": "expName~KEY~treatName~valName~UTC", "type": "string", "sval": "yummy string with comma, eh?", "X": "0", "Y": "1"} `


* Deploy the app to GAE: `gcloud_deploy.sh`
* How can I see the python app standard out?  
  * By using the console stackdriver logging
  * https://console.cloud.google.com/logs/viewer

file:///Users/rob/gcp/pubsub-bigquery-example/pubsub/README.md

https://cloud.google.com/appengine/docs/flexible/python/writing-and-responding-to-pub-sub-messages

* Python API docs (dynamically built by the python code)
  * [https://developers.google.com/resources/api-libraries/documentation/bigquery/v2/python/latest/](bigquery v2 API)
  * [https://developers.google.com/resources/api-libraries/documentation/pubsub/v1beta2/python/latest/](pubsub v1beta2 API)


