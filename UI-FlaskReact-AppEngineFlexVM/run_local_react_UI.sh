#!/bin/bash

# Run the ReactJS web server.

# Get the path to THIS script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR/ReactFrontEnd/

# For local testing
export REACT_APP_FLASK_URL=http://food.computer.com:5000

# For running react locally, but using the gcloud hosted flask
#export REACT_APP_FLASK_URL=https://flaskapi-dot-openag-v1.appspot.com

npm start

