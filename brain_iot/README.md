# Test scripts so I can convert the brain pub-sub stuff to IoT mqtt

## Done:
- We will use the `mqtt_config_topic = '/devices/{device_id}/config'` for receiving commands.  We will track and save the last version that was received since the broker resends old config messages upon connection.
- The backend will send commands to the device using its config IoT topic.
- mqtt sample publishes to a device-events topic

## WIP

debugrob: 
- Create a NEW PubSub service that reads the device-events topic: `projects/openag-v1/topics/device-events`.

- Finish brain wrapping `iot_publisher.py` and `iot_command_subscriber.py`


### Notes
debugrob: 
- Can only have ONE active mqtt connection per device.
  - So, can't have two separate python processes, need a single proc.

- QOS = 2 is NOT supported by google, must use 1
- Can't subscribe to a pub-sub topics, such as: `projects/openag-v1/topics/commands`
- Google MQTT broker ONLY uses client ID's in this format: projects/{project-id}/locations/{cloud-region}/registries/{registry-id}/devices/{device-id}

- When an MQTT `event` is published to mqtt topic: 
  - `/devices/{device_id}/events`
  - the default telemetry pub-sub topic the mqtt broker sends the message to is:
    - `projects/openag-v1/topics/device-events`
- The device-events-subs/ dir contains a test pubsub subscriber for topic:
    projects/openag-v1/topics/device-events


### docs
- https://github.com/GoogleCloudPlatform/python-docs-samples/tree/master/iot/api-client/mqtt_example
- https://eclipse.org/paho/clients/python/docs/
- https://github.com/eclipse/paho.mqtt.python
- https://www.hivemq.com/blog/how-to-get-started-with-mqtt
- https://cloud.google.com/iot/docs/how-tos/mqtt-bridge#publishing_telemetry_events_to_multiple_pubsub_topics
- https://cloud.google.com/iot/docs/how-tos/mqtt-bridge#iot-core-mqtt-auth-run-python
- https://cloud.google.com/iot/docs/how-tos/config/configuring-devices


