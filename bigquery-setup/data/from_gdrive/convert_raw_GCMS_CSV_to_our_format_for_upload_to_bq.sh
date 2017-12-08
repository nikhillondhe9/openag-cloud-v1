#!/bin/bash

# make a list of exp. 1-3 and treats with created dates for input.
#   experiment names (in our DB):
#   1-20160515OB-UVC  Treat1-6
#   2-20160501OB-UV   Treat1-8
#   3-20161017OB-UV   Treat1-8
# add sample name for each treat
# make a list of gcms.csv files for input
# pass above into this script to build our two data files for BQ

# 1. get input args: gcms-id, file.csv
#     - id: <experiment name>~<treatment name>~<sample name>~<created UTC TS>
# 2. create gcms.csv with column header comment.
#     - #id,mass,nplants
# 3. create mol.csv with column header comment.
#     - #id,RT,RI,abundance,CAS,weight
# 4. append constant line to gcms.csv
#     - <gcms-id>,0,0
# 5. parse input csv file:
#     - ignore first line
#     - pull out 3,4,5 fields: "COMPOUND","RT","ABUNDANCE"
# 6. create mol-id = <gcms-id> + '~<compound>'
# 7. append one line to mol.csv
#     - <mol-id>,<RT>,0,<abund>,,

#------------------------------------------------------------------------------
# 1. Command line arg processing
if [ $# -lt 2 ]; then
  echo "Please provide the GCMS-ID and gcms.csv file name to read."
  echo "Examples: "
  echo "	<experiment name>~<treatment name>~<sample name>~<created UTC TS>"
  echo "	1-20160515OB-UVC~Treat1~UL~2016-05-15T00:00:00.0Z"
  exit 1
fi
GCMSID=$1
FILE=$2

# 2. and 3. if the files do NOT exist
if [ ! -e gcms.csv ]; then 
  echo "#id,mass,nplants" > gcms.csv
fi
if [ ! -e mol.csv ]; then 
  echo "#id,RT,RI,abundance,CAS,weight" > mol.csv
fi

# 4. Append constant line to gcms.csv
#    Must use "" around id incase it has a space in any of the names.
echo "\"$GCMSID\",," >> gcms.csv

#------------------------------------------------------------------------------
# Parse a CSV line and return the field without " or ~ chars. 
# 3rd arg is the retuned string.
get_field(){
  LINE=$1       # line to parse
  FIELD_NUM=$2  # field number, starting with 1
  local __resultvar=$3  # the name of the return variable
  local myresult=`echo "$LINE" | cut -d , -f $FIELD_NUM | sed -e "s/\"//g" | sed -e "s/\~//g"`
  eval $__resultvar="'$myresult'"  # copy the local internal var to return var
}

#------------------------------------------------------------------------------
# 5. parse input csv file:
#     - ignore first line
#     - pull out 3,4,5 fields: "COMPOUND","RT","ABUNDANCE"
readFirstLine=0
while read -r LINE
  do
  if [ $readFirstLine = 0 ]; then  # ignore the first line
    readFirstLine=1
    continue
  fi
  #echo "LINE=$LINE" 
  get_field "$LINE" 3 COMPOUND
  get_field "$LINE" 4 RT
  get_field "$LINE" 5 ABUNDANCE

  # handle fields that can be "NA"
  if [ "$RT" = "NA" ]; then RT=""; fi
  if [ "$ABUNDANCE" = "NA" ]; then ABUNDANCE=""; fi
  #echo "$COMPOUND,$RT,$ABUNDANCE"

  # 6. create mol-id = <gcms-id> + '~<compound>'
  MOLID="$GCMSID~$COMPOUND"

  # 7. append one line to mol.csv
  #     - <mol-id>,<RT>,,<abund>,,
  echo "\"$MOLID\",$RT,,$ABUNDANCE,," >> mol.csv

done < "$FILE"

