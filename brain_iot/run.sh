#!/bin/bash

#if [ $# -eq 0 ]; then
#    echo "Please provide your device_id on the command line."
#    exit 1
#fi

FILE='rsa_private.pem'
if [ ! -f $FILE ]; then
    echo "Error: The $FILE file needs to be in the current directory."
    exit 1
fi

# make our pipes if they don't exist
DATA_FIFO='data.fifo'
if [ ! -p $DATA_FIFO ]; then
    mkfifo -m 0660 $DATA_FIFO
fi
COMMAND_FIFO='command.fifo'
if [ ! -p $COMMAND_FIFO ]; then
    mkfifo -m 0660 $COMMAND_FIFO
fi

# deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

# Load our local python3 virtual environment with the modules we need.
source pyenv/bin/activate

# Load the google cloud project environment variable.
source ../gcloud_env.bash

# MUST use the central region / zone for beta IoT product.
GCLOUD_REGION=us-central1
GCLOUD_ZONE=us-central1-c

# Kill service accounts, since for IoT we won't deploy it (in gcloud_env.bash).
export GOOGLE_APPLICATION_CREDENTIALS=

# Remember to copy over *.pem from ../device-registration/

DEVICE_ID=$1


#------------------------------------------------------------------------------
# When the user kills this script with Ctrl-C, also kill the sub processes.
function kill_all_sub_procs()
{
    for proc in `jobs -p`
    do
        kill -s TERM $proc  
    done
    #killall python3  
}
trap kill_all_sub_procs SIGINT


#------------------------------------------------------------------------------
# Start a fake command reader (in place of the C brain) so our code
# won't block when it writes commands to the pipe.
(
  ./command_reader.py $COMMAND_FIFO 
) &


#------------------------------------------------------------------------------
# Need to write something to the data pipe, to get past the blocking open.
# So run this as a background process.
(
    sleep 2 # wait a few seconds for the script below to start
    ./write_noop.py --pipe $DATA_FIFO
) &


#------------------------------------------------------------------------------
python3 iot_pubsub.py \
   --log debug \
   --project_id=$GCLOUD_PROJECT \
   --registry_id=$GCLOUD_DEV_REG \
   --cloud_region=$GCLOUD_REGION \
   --private_key_file=$FILE \
   --ca_certs=roots.pem \
   --dataFIFO=$DATA_FIFO \
   --commandFIFO=$COMMAND_FIFO \
   --device_id=$DEVICE_ID


