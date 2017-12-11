#!/bin/bash

# This script is specific to experiment 4 (because of how the data was saved).
# (the temp/humidity reading code can be reused, since we use the same
#  data loggers for all experiments up to #9)

EXP='4-20170622OB-UV'
HARVEST='2017-07-13T00:00:00.0Z'

OUTPUT='val.csv'

PHE='data.csv'
ENV_T1='temp_humid/0.0.csv'
ENV_T2='temp_humid/0.1.csv'
ENV_T3='temp_humid/0.2.csv'
ENV_T4='temp_humid/1.0.csv'
ENV_T5='temp_humid/1.1.csv'
ENV_T6='temp_humid/1.2.csv'
ENV_T7='temp_humid/2.0.csv'
ENV_T8='temp_humid/2.1.csv'
# no temp/humid data collected for 2.2 / treatement 9

#------------------------------------------------------------------------------
# Parse a CSV line and return the field without " or ~ chars. 
# 1st arg is the line to parse.
# 2nd arg is the field number, starting at 1.
# 3rd arg is the retuned string.
get_field(){
  LINE=$1       
  FIELD_NUM=$2 
  local __resultvar=$3  # the name of the return variable
  local myresult=`echo "$LINE" | cut -d , -f $FIELD_NUM | sed -e "s/\"//g" | sed -e "s/\~//g"`
  eval $__resultvar="'$myresult'"  # copy the local internal var to return var
}

#------------------------------------------------------------------------------
# Parse a CSV file of temp and humidity values from our data loggers.
# 1st arg is the experiment.
# 2nd arg is the treatment.
# 3rd arg is the file to parse.
# 4th arg is the output file.
parse_temp_humid(){
  E=$1       
  T=$2       
  FILE=$3
  OP=$4
  readFirstLine=0
  while read -r LINE
    do
    if [ $readFirstLine = 0 ]; then  # ignore the first line
      readFirstLine=1
      continue
    fi
    #echo "LINE=$LINE" 
    #      Date/Time,Temperature,Humidity
    #      7,        8,          9
    get_field "$LINE" 7 CREATED
    get_field "$LINE" 8 TEMP
    get_field "$LINE" 9 HUMID

    # convert date to our format (Mac OSX specific command syntax)
    SECS=`date -j -u -f "%F %T" "$CREATED" "+%s"`
    TS=`date -j -u -r $SECS "+%FT%TZ"`

    # 6. Create Values keyed to 'Env' Environmental Data
    #      'AirTemp', 'Humidity'
    # 7. Append to val.csv
    echo "\"$E~Env~$T~AirTemp~$TS\",float,,,$TEMP,," >> $OP
    echo "\"$E~Env~$T~Humidity~$TS\",float,,,$HUMID,," >> $OP

  done < "$FILE"
}

#------------------------------------------------------------------------------
# 0. Create val.csv if it doesn't exist.

# 1. Extract info from data.csv:
#      - ignore first line
#      rack,tray,x,y, height (in),weight (g)
#      3,   4,   5,6, 8,          9
# 2. convert inches to cm
# 3. Create Values keyed to 'Phe' Phenotypic Expression.
#      'Height', 'Weight (fresh)'
# 4. Append to val.csv

# 5. Extract info from temp_humid/<rack>.<tray>.csv
#      - ignore first line
#      Date/Time,Temperature,Humidity
#      7,        8,          9
# 6. Create Values keyed to 'Env' Environmental Data
#      'AirTemp', 'Humidity'
# 7. Append to val.csv

# Value ID: 
#   <experiment name>~Phe~<treatment name>~<value name>~<created UTC TS>
#   <experiment name>~Env~<treatment name>~<value name>~<created UTC TS>

#------------------------------------------------------------------------------
# 0. Create val.csv if it doesn't exist.
if [ ! -e $OUTPUT ]; then 
  echo "#Value ID,Type,Sval,Ival,Fval,X,Y" > $OUTPUT
fi

#------------------------------------------------------------------------------
# 1. Extract info from data.csv:
readFirstLine=0
while read -r LINE
  do
  if [ $readFirstLine = 0 ]; then  # ignore the first line
    readFirstLine=1
    continue
  fi
  #echo "LINE=$LINE" 
  #      rack,tray,x,y, height (in),weight (g)
  #      3,   4,   5,6, 8,          9
  get_field "$LINE" 3 RACK
  get_field "$LINE" 4 TRAY
  get_field "$LINE" 5 X
  get_field "$LINE" 6 Y
  get_field "$LINE" 8 HEIGHT_IN
  get_field "$LINE" 9 WEIGHT

  # 2. convert inches to cm (bash only has ints, so use awk to handle float)
  HEIGHT_CM=`awk '{print $1*2.54}' <<<"$HEIGHT_IN"`

  # Determine the treatment based on rack & tray
  TRE='Treat9'
  if [[ "$RACK" = "0" && "$TRAY" = "0" ]]; then TRE="Treat1"; fi
  if [[ "$RACK" = "0" && "$TRAY" = "1" ]]; then TRE="Treat2"; fi
  if [[ "$RACK" = "0" && "$TRAY" = "2" ]]; then TRE="Treat3"; fi
  if [[ "$RACK" = "1" && "$TRAY" = "0" ]]; then TRE="Treat4"; fi
  if [[ "$RACK" = "1" && "$TRAY" = "1" ]]; then TRE="Treat5"; fi
  if [[ "$RACK" = "1" && "$TRAY" = "2" ]]; then TRE="Treat6"; fi
  if [[ "$RACK" = "2" && "$TRAY" = "0" ]]; then TRE="Treat7"; fi
  if [[ "$RACK" = "2" && "$TRAY" = "1" ]]; then TRE="Treat8"; fi
  if [[ "$RACK" = "2" && "$TRAY" = "2" ]]; then TRE="Treat9"; fi

  # 3. Create Values keyed to 'Phe' Phenotypic Expression.
  #      'Height', 'Weight (fresh)'
  # 4. Append to val.csv
  echo "\"$EXP~Phe~$TRE~Height~$HARVEST\",float,,,$HEIGHT_CM,$X,$Y" >> $OUTPUT
  echo "\"$EXP~Phe~$TRE~Weight (fresh)~$HARVEST\",float,,,$WEIGHT,$X,$Y" >> $OUTPUT

done < "$PHE"


#------------------------------------------------------------------------------
# 5. Extract info from temp_humid/<rack>.<tray>.csv
parse_temp_humid $EXP 'Treat1' $ENV_T1 $OUTPUT
parse_temp_humid $EXP 'Treat2' $ENV_T2 $OUTPUT
parse_temp_humid $EXP 'Treat3' $ENV_T3 $OUTPUT
parse_temp_humid $EXP 'Treat4' $ENV_T4 $OUTPUT
parse_temp_humid $EXP 'Treat5' $ENV_T5 $OUTPUT
parse_temp_humid $EXP 'Treat6' $ENV_T6 $OUTPUT
parse_temp_humid $EXP 'Treat7' $ENV_T7 $OUTPUT
parse_temp_humid $EXP 'Treat8' $ENV_T8 $OUTPUT


