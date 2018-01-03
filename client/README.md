# Python publish and subscribe client scripts

## One time setup
```
./one_time_setup.sh
```

## Run the command subscriber
```
./run_command_subscriber.sh
```

## Send a command from the command line (can also do from console - publish a message to the topic from)  
```
./send_command.sh
```

## Send a data Value to our PubSub service (is it running locally or on GAE?)
```
./send_value.sh --help
./send_value.sh --value 1 --variableName Temp
```

## Query for the last 5 Values in BigQuery
```
./query.sh
```

## How to get docs from the google python class
```
source pubsub_env/bin/activate
python3 -c "from google.cloud import pubsub; help(pubsub)" > doc.pubsub.txt
```
