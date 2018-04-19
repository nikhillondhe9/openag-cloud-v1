# openag-v1 MQTT to BigQuery AppEngine flex VM
GCP App Engine flex env project to subscribe to an MQTT device event telemetry topic, validate the data and batch insert (stream) it into BigQuery.

* One time setup to run locally:
```
cd ~/openag-v1/
./one_time_setup.sh
```

* To run this app locally (on OSX) for testing:
```
cd ~/openag-v1/MqttToBigQuery-AppEngineFlexVM/
./run_locally.sh
```

* To deploy this app:
```
./gcloud_deploy.sh
```


## How can I see the python app standard out when it is deployed to GAE?  
  * By using the console stackdriver logging
  * https://console.cloud.google.com/logs/viewer

## Docs 
- https://googlecloudplatform.github.io/google-cloud-python/latest/bigquery/usage.html
- https://googlecloudplatform.github.io/google-cloud-python/latest/bigquery/reference.html
- https://github.com/GoogleCloudPlatform/python-docs-samples/tree/master/iot/api-client/mqtt_example
- https://eclipse.org/paho/clients/python/docs/
- https://github.com/eclipse/paho.mqtt.python
- https://www.hivemq.com/blog/how-to-get-started-with-mqtt
- https://cloud.google.com/iot/docs/how-tos/mqtt-bridge#publishing_telemetry_events_to_multiple_pubsub_topics
- https://cloud.google.com/iot/docs/how-tos/mqtt-bridge#iot-core-mqtt-auth-run-python
- https://cloud.google.com/iot/docs/how-tos/config/configuring-devices

