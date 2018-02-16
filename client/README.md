# Python subscribe test scripts
The latest (production) subscribe code is in the brain/python repo:
`https://github.com/OpenAgInitiative/openag_brain_v2.git`

The latest publish code is in this repo, in the Node commands.js class.

## One time setup
```
./one_time_setup.sh
```

## Run the testing command subscriber (just prints raw JSON)
```
./run_command_subscriber.sh
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
