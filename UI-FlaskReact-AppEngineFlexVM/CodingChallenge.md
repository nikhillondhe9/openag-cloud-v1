# Coding Challenge
This challenge is to improve the user account recovery process.  This web app currently doesn't support emailing the user an account reset link.  The challenge is to add that functionality to a work branch and submit a PR.

## Set up
Run: `./one_time_setup_for_local_development.sh`

## Run the UI
Run: `./run_local_react_UI.sh`

## Run the Flask API (after some work)
You won't be able to run the Flask API server, since we won't provide the service account credentials to our google cloud platform backend.  For this challenge you should stub the flask API so it doesn't connected to the backend and just uses a text file to hold user accounts.

After making the changes, run: `./run_local_flask_API.sh`
