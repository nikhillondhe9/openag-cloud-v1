# OpenAg Node.js UI for recipe and device management.

## debugrob, TBD:
- See ToDos in app/model/user.js  and server.js
- Email new account verification scheme.
- Google reCaptcha on signup.

- http://blog.robertonodi.me/node-authentication-series-email-and-password/
- https://github.com/ctavan/express-validator
- https://medium.com/the-ideal-system/ooth-user-accounts-for-node-js-93cfcd28ed1a
- https://codeforgeek.com/2014/07/node-email-verification-script/
- https://codemoto.io/coding/nodejs/email-verification-node-express-mongodb
- https://stackoverflow.com/questions/39092822/how-to-do-confirm-email-address-with-express-node

## Using Redis as the memcached session store (one time setup already done)
- Make a free "Redis Memcached Cloud" account.
 - https://app.redislabs.com/#/bdbs
 - Under subscriptions, add a default DB (also called bucket)
  - DB/bucket: OpenAgUIsessions
  - Enable SASL account:       
   - user: rbaynes@gmail.com
   - pass: Il0veRedis
  - Save the buckets' endpoint:
   - memcached-17341.c1.us-east1-2.gce.cloud.redislabs.com:17341
 - Later, if we want to store other data in the memcached, use memjs
  - https://redislabs.com/lp/using-memcached-cloud-multiple-languages/#opening-a-connection-to-memcached-using-memjs

## Deploying to the Google App Engine
1. `cd openag-cloud-v1/UI-AppEngineFlexVM`
2. `./gcloud_deploy.sh`

## Local installation for development and testing

1. Install [https://github.com/creationix/nvm#installation](nvm).
2. Use nvm to install node: `nvm install stable`
3. Make this version of node the default: `nvm alias default stable`
4. `cd openag-cloud-v1/UI-AppEngineFlexVM`
5. Install packages: `npm install`
6. Run the Node.js server locally: `./run_locally.sh`
7. [http://localhost:8080](View the app). 


## Documentation 
- [https://github.com/googleapis/nodejs-bigquery](BigQuery client for Node.js)
- [https://github.com/GoogleCloudPlatform/google-cloud-node](Google Cloud client for Node.js)

