# Communication details for the OpenAg™ Food Computer™ 

## Technologies used by the OpenAg™ Food Computers™ and cloud services
- RSA public / private keys
- Google Firebase cloud functions
- Google Firestore document database
- Google IoT MQTT publish / subscribe messaging
- Google App Engine virtual machines 
- Google Datastore document database (user profile, devices, recipes)
- Google BiqQuery data warehouse (streaming device data)
- Google cloud storage for blobs (images)
- React / Flask web / mobile UI

## Step 1: Register a Food Computer™
Our standard microcomputer is a Beaglebone Black running Debian 9.3.  All our code also runs on OSX.
- On the device we run a script which:
  - Generates RSA public and private keys.
  - Uses curl to POST the public key to a firebase cloud function.
  - The firebase cloud function inserts the public key into a firestore document database, along with some metadata (verification code, device MAC, user's email).
  - The script prints a 'verification code' for the user to enter into the UI.

## Step 2: Authenticate a Food Computer™
- User logs into our cloud UI (or creates an account).
- On the device registration page, user enters the 'verification code'. they got in step 1.
- The UI will find the devices public key in the firestore database and create an authorized device in our IoT MQTT registry.
- The UI will also make an entry in the device table in the datastore and link the device to the user's account.

## Step 3: Run a Climate Recipe on the Food Computer™
- User chooses or creates a climate recipe and sends it to the Food Computer™.
  - The climate recipe is serialized into our new JSON format.
  - The JSON is published as an IoT config message to the Food Computer™.
  - The Food Computer™ runs the climate recipe.

## Step 4: The Food Computer™ publishes data
- The Food Computer™ continuously publishes data and images according to the schedule specified in the climate recipe.
- Our MQTT-PubSub service (running as an App Engine managed virtual machine) receives, validates and saves the data in a BigQuery dataset and in the real time Datastore for fast UI access.  Images are indexed and stored in cloud storage.

## Step 5: Monitor a Food Computer™ using the UI
- The UI shows the user the current state of their Food Computers™:
  - Current and historical environmental variables.
  - Status of the running climate recipe.
  - Latest image (or timelaps up to now).
  - Alerts based on ML / CV we will do in the future.


