#!/usr/bin/env python3

# Common local function library for python (3).

import os

# Check for some mandatory environment variables for GCP.
# Returns True / False.
def ValidEnvForGCP():

  # Is the python virtual env for py3 activated?
  if None == os.getenv("VIRTUAL_ENV"):
    print( "Please run 'source env/bin/activate' from the top level dir." )
    return False

  # Is Google Cloud set up?
  if None == os.getenv("GCLOUD_PROJECT") or \
     None == os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    print( "ERROR: gcloud_env.bash has not been sourced." )
    return False
  
  # Is BigQuery set up?
  if None == os.getenv("DATA_DS"):
    print( "ERROR: bq_env.bash has not been sourced." )
    return False

  return True


