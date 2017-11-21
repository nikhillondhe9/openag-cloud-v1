#!/bin/bash

source gcloud_env.bash

# This next command should automatically authorize this computer to our
# cloud project with the service_account.json credentials (did you remember to
# decrypt it?) If it opens a browser window to verify your google account, 
# something is wrong.
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS --project=$GCLOUD_PROJECT

bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$EXP_TABLE\` where true"
bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$TRE_TABLE\` where true"
bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$COM_TABLE\` where true"
bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$VAL_TABLE\` where true"
