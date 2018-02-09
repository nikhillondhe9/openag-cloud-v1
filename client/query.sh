#!/bin/bash

source gcloud_env.bash

bq query --quiet --use_legacy_sql=false \
'SELECT id,fval,sval FROM test.val '\
'  WHERE "UTC" != REGEXP_EXTRACT(id, r"(?:[^\~]*\~){4}([^~]*)") '\
' ORDER BY REGEXP_EXTRACT(id, r"(?:[^\~]*\~){4}([^~]*)") DESC '\
' LIMIT 5'

