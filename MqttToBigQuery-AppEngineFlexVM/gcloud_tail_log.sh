#!/bin/bash

gcloud app logs read -s mqtt

# tail seems to show some months old log entries.  
#gcloud app logs tail -s mqtt
