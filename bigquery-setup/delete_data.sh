#!/bin/bash

source gcloud_env.bash

bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$EXP_TABLE\` where true"
bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$TRE_TABLE\` where true"
bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$COM_TABLE\` where true"
bq query --use_legacy_sql=false "delete FROM \`$GCLOUD_PROJECT.$DATASET.$VAL_TABLE\` where true"
