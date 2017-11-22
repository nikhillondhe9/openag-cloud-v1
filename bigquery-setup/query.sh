#!/bin/bash

source gcloud_env.bash

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
echo "All values (from temp funcs that handle type):"
bq query --quiet --use_legacy_sql=false \
"CREATE TEMPORARY FUNCTION isFloat(type STRING) AS (TRIM(type) = \"float\"); "\
"CREATE TEMPORARY FUNCTION getFloatAsStr(fval FLOAT64, ival INT64, sval STRING) AS (CAST( fval AS STRING)); "\
"CREATE TEMPORARY FUNCTION isInt(type STRING) AS (TRIM(type) = \"int\"); "\
"CREATE TEMPORARY FUNCTION getIntAsStr(fval FLOAT64, ival INT64, sval STRING) AS (CAST( ival AS STRING)); "\
"CREATE TEMPORARY FUNCTION isString(type STRING) AS (TRIM(type) = \"string\"); "\
"CREATE TEMPORARY FUNCTION getString(fval FLOAT64, ival INT64, sval STRING) AS (TRIM(sval)); "\
"CREATE TEMPORARY FUNCTION getValAsStr(type STRING, fval FLOAT64, ival INT64, sval STRING) AS ( "\
"  IF( isFloat(type), getFloatAsStr(fval,ival,sval),  "\
"      IF( isInt(type), getIntAsStr(fval,ival,sval), "\
"            IF( isString(type), getString(fval, ival, sval), \"null\")))); "\
"SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as Experiment, "\
"  REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){2}([^~]*)\") as Treatment, "\
"  FORMAT_TIMESTAMP( \"%c\", TIMESTAMP( "\
"    REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){4}([^~]*)\")), \"UTC\") as Time, "\
"  REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){3}([^~]*)\") as Name, "\
"  getValAsStr(type,fval,ival,sval) as Value "\
"  FROM $DATASET.$VAL_TABLE "\
"  ORDER BY id LIMIT 10"


echo ""
echo "All experiments:"
bq query --quiet --use_legacy_sql=false "SELECT REGEXP_EXTRACT(id, r\"[^~]+\") as experiment, FORMAT_TIMESTAMP( \"%c\", TIMESTAMP( REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){1}([^~]*)\")), \"UTC\") as created, user FROM $DATASET.$EXP_TABLE ORDER BY id LIMIT 10"
