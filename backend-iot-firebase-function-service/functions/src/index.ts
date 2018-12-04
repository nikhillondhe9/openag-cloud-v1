// Firebase cloud TypeScript (compiled to JS) function to
// recieve a POSTed public key from a device and insert the key into
// the Firestore document DB.
//
// For testing a local server:
// curl http://localhost:5000/fb-func-test/us-central1/saveKey  -H "Content-Type: application/json" -X POST --data '{"key": "rob", "cksum": "1", "MAC":"and cheese", "timestamp": "2018-12-04T15:52:52Z"}'
//
// For testing a deployed server:
// curl https://us-central1-fb-func-test.cloudfunctions.net/saveKey  -H "Content-Type: application/json" -X POST --data '{"key": "rob", "cksum": "1", "MAC":"and cheese", "timestamp": "2018-12-04T15:52:52Z"}'


'use strict';

import * as functions from 'firebase-functions'
const admin = require('firebase-admin');

const schema = {
  "properties": {
    "key": { "type": "string" },
    "cksum": { "type": "string" },
    "state": { "type": "string" },
    "MAC": { "type": "string" },
    "timestamp": { "type": "string" }
  },
  "required": ["key", "cksum", "MAC"],
  "additionalProperties": false
};
// debugrob: later after all new brain code is deployed, make timestamp required.   Sometime in Feb. 2019.

const Ajv = require('ajv');
let ajv = new Ajv({allErrors: true});
const validate = ajv.compile( schema )


admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

// our doc DB collection 
var db = admin.firestore();
var objectsRef = db.collection('devicePublicKeys');

// firebase cloud function
export const saveKey = functions.https.onRequest((request, response) => {
    if( request.method != 'POST' ) {
        response.status(403).json({error: 
            "invalid HTTP method, only POST allowed"});
    }

    // this uses the JSON data POSTed in the URL
    let doc = request.body;
    //console.log( 'Received:', doc );
    let isvalid = validate( doc );

    // add the state property
    doc.state = "unclaimed";

    // add doc to the DB
    if( isvalid ) {
        objectsRef.add( doc ).then( newdoc => {
            console.log('Added document with ID: ', newdoc.id);
            response.json({ok: newdoc.id});
        });
    } else {
        console.log( 'Invalid:' + ajv.errorsText(validate.errors));
        response.status(422).json({error: "Validation Failed: " + 
            ajv.errorsText(validate.errors)}); 
    }
});

