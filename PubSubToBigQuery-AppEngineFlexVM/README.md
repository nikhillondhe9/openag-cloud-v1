# openag-cloud-v1 PubSub to BigQuery AppEngine flex VM
GCP App Engine flex env project to subscribe to a PubSub topic, validate the data and batch insert (stream) it into BigQuery.

* One time setup to run locally:
```
cd ~/openag-cloud-v1/
./setup_pubsub_env.sh
```

* To run this app locally (on OSX) for testing:
```
cd ~/openag-cloud-v1/PubSubToBigQuery-AppEngineFlexVM/
./run_locally.sh
```

* To deploy this app:
```
./gcloud_deploy.sh
```

* Manually send a message with the web console
  * [https://console.cloud.google.com/cloudpubsub/topics/test-topic?project=openag-cloud-v1](our topic and subscription)
  * Try typing JSON into the Message (must use double quotes in console): 
    * ` {"data": "hello"} `
    * ` {"id": "expName~KEY~treatName~valName~UTC", "type": "float", "fval": "2.34", "X": "1", "Y": "3"} `
    * ` {"id": "expName~KEY~treatName~valName~UTC", "type": "string", "sval": "yummy string with comma, eh?", "X": "0", "Y": "1"} `

* How can I see the python app standard out when it is deployed to GAE?  
  * By using the console stackdriver logging
  * https://console.cloud.google.com/logs/viewer

* Python API docs (dynamically built by the python code)
  * [https://developers.google.com/resources/api-libraries/documentation/bigquery/v2/python/latest/](bigquery v2 API)
  * [https://developers.google.com/resources/api-libraries/documentation/pubsub/v1beta2/python/latest/](pubsub v1beta2 API)


