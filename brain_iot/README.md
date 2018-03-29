## Test scripts so I can convert the brain pub-sub stuff to IoT mqtt

### WIP

debugrob:
    Try using the config topic to send commands to a single device:
        mqtt_config_topic = '/devices/{device_id}/config'
    How to send a configuration to a device: https://cloud.google.com/iot/docs/how-tos/config/configuring-devices

- Have the device send its current status as a JSON string to the `state` IoT/MQTT topic?

- Backend sends commands to the device using its `config` IoT/MQTT topic?


debugrob: 
    get the mqtt sample publishing an EnvVar via the mqtt events


debugrob: 
    Write a NEW PubSub service for IoT device events sent to pubsub topic:
        `projects/openag-v1/topics/device-events`


### Notes
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
- https://www.eclipse.org/paho/clients/python/
- https://github.com/eclipse/paho.mqtt.python
- https://www.hivemq.com/blog/how-to-get-started-with-mqtt
- https://cloud.google.com/iot/docs/how-tos/mqtt-bridge#publishing_telemetry_events_to_multiple_pubsub_topics
- https://cloud.google.com/iot/docs/how-tos/mqtt-bridge#iot-core-mqtt-auth-run-python
- https://cloud.google.com/iot/docs/how-tos/config/configuring-devices


