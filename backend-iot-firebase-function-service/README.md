## Firebase cloud function 

What this function does:
- accepts a POSTed pubic RSA key (as JSON)
- validates the JSON against the document DB schema
- inserts the document into our Firestore 'devicePublicKeys' collection


## See the device-registration dir for the POST from the device.

## Setup Notes
- If you see this error: `Error: The Cloud Firestore API is not enabled for the project fb-func-test`
- Then go to https://console.firebase.google.com
  - Develop > Database and enable "Cloud Firestore beta".

