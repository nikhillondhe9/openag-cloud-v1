# Communication details for the OpenAg Food Computer 

#debugrob: add TM around OA and FC

## Technologies used by the OpenAg Food Computers and backend services
- RSA public / private keys
- Google Firebase cloud functions
- Google Firestore document database
- Google IoT MQTT publish / subscribe messaging
- Google App Engine virtual machines 
- Google Datastore document database (user profile, devices, recipes)
- Google BiqQuery data warehouse (streaming device data)
- Google cloud storage for blobs (images)
- React / Flask web / mobile UI

## Step 1: Register a Food Computer
Our standard device is a Beaglebone Black running Debian 9.3.  All our code also works on OSX.
- On the device we generate RSA public and private keys.
- On the device we use curl to POST the public key to a firebase cloud function.
- The user is given a 'verification code' to enter into the UI.
- The firebase cloud function inserts the public key into a firestore document database, along with some metadata (verification code, device MAC, user's email).

## Step 2: Authenticate a Food Computer
- Log into our web UI (or create an account).
- On the device registration page, enter the 'verification code'. you got in step 1.
- The web UI will find the devices public key in the firestore database and create an authorized device in our IoT MQTT registry.
- The web UI will also make an entry in the device table in the datastore and link the device to the user's account.

## Step 3: Run a Climate Recipe on the Food Computer

## Step 4: The Food Computer publishes data

## Step 5: Monitor a Food Computer using the web UI
