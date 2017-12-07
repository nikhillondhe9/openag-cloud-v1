#!/bin/bash

echo '"","EXP.ID","COMPOUND","RT","ABUNDANCE","PROFILE.ID"'
echo '"1","20160501OB-UV-2","Eucalyptol",13.147,226323124,"PL3"'

# experiment names (in our DB):
# 1-20160515OB-UVC
# 2-20160501OB-UV
# 3-20161017OB-UV

#gcms table format:
#id: <experiment name>~<treatment name>~<sample name>~<created UTC TS>
#id,mass,nplants

#mol table format:
#id: <experiment name>~<treatment name>~<sample name>~<created UTC TS>~<molecule name>
#id,RT,RI,abundance,CAS,weight
