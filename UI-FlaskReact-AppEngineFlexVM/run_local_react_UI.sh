#!/bin/bash

# Run the ReactJS web server.

# Get the path to THIS script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR/ReactFrontEnd/
npm start

