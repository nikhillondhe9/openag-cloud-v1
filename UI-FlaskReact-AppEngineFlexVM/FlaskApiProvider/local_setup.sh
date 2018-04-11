#!/bin/bash
filelocation=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$filelocation"
export GOOGLE_APPLICATION_CREDENTIALS=/Users/manvithaponnapati/Documents/OpenAgGitRepo/openag-cloud-v1/UI-FlaskReact-AppEngineFlexVM/FlaskApiProvider/authenticate.json

echo $GOOGLE_APPLICATION_CREDENTIALS