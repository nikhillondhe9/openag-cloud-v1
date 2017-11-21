#!/bin/bash

source gcloud_env.bash

# This next command should automatically authorize this computer to our
# cloud project with the service_account.json credentials (did you remember to
# decrypt it?) If it opens a browser window to verify your google account, 
# something is wrong.
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS --project=$GCLOUD_PROJECT

echo ""
echo "Air temp values for exp 4, treat 2:"
bq query --quiet --use_legacy_sql=false \
"SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as Experiment, "\
"  REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){2}([^~]*)\") as Treatment, "\
"  FORMAT_TIMESTAMP( \"%c\", TIMESTAMP( "\
"    REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){4}([^~]*)\")), \"UTC\") as Time, "\
"  REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){3}([^~]*)\") as Sensor, "\
"  fval as Value "\
"  FROM $DATASET.$VAL_TABLE "\
"  WHERE REGEXP_CONTAINS(id, r\"4-2017.*~Env~Treat2~Air Temp.*\") "\
"  ORDER BY id LIMIT 10"

echo ""
echo "All LED values:"
#bq query --quiet --use_legacy_sql=false "SELECT id,ival FROM $DATASET.$VAL_TABLE WHERE REGEXP_CONTAINS(id, r\".*~Env~.*~LED.*\") ORDER BY id LIMIT 10"
bq query --quiet --use_legacy_sql=false \
"SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as Experiment, "\
"  REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){2}([^~]*)\") as Treatment, "\
"  FORMAT_TIMESTAMP( \"%c\", TIMESTAMP( "\
"    REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){4}([^~]*)\")), \"UTC\") as Time, "\
"  REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){3}([^~]*)\") as Actuator, "\
"  ival as Value "\
"  FROM $DATASET.$VAL_TABLE "\
"  WHERE REGEXP_CONTAINS(id, r\".*~Env~.*~LED.*\") "\
"  ORDER BY id LIMIT 10"

echo ""
echo "All experiments:"
bq query --quiet --use_legacy_sql=false "SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as experiment, FORMAT_TIMESTAMP( \"%c\", TIMESTAMP( REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){1}([^~]*)\")), \"UTC\") as created, user FROM $DATASET.$EXP_TABLE ORDER BY id LIMIT 10"
