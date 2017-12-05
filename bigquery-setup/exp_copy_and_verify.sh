#!/bin/bash

source gcloud_env.bash

# Command line arg processing
if [ $# -lt 1 ]; then
  echo "Please provide the experiment you want to copy."
  echo "For example: 4-20170622OB-UV"
  exit 1
fi
EXP=$1

./copy_experiment.py --experiment $EXP --sourceDS $DATA_DS --destDS $PUBLIC_DATA_DS

echo "Dumping data and comparing results..."
RES_SRC="results_exp_source.txt"
RES_DEST="results_exp_dest.txt"

./show_exp.py --showValues --dataset $DATA_DS --experiment $EXP > $RES_SRC
./show_exp.py --showValues --dataset $PUBLIC_DATA_DS --experiment $EXP > $RES_DEST

diff $RES_SRC $RES_DEST
if [ $? -eq 1 ]; then
  echo "ERROR: results don't match, tell Rob to figure out why."
  exit 1 
else
  echo "Results match."
  rm $RES_SRC $RES_DEST
fi
echo "Done."
