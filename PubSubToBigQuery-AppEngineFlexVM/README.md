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
  * Try typing JSON into the Message: `{'data': 'hello'}`


* Deploy the app to GAE: `gcloud_deploy.sh`
* How can I see the python app standard out?  (check log file redirect from docker CMD)

file:///Users/rob/gcp/pubsub-bigquery-example/pubsub/README.md

https://cloud.google.com/appengine/docs/flexible/python/writing-and-responding-to-pub-sub-messages

* PubSub REST API (dynamically built by the python code)
https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.subscriptions/create


