#!/usr/bin/env python3

import sys, json

if __name__=='__main__':

    if  len(sys.argv) < 2:
        print( 'Error! Need to pass a pipe name to open for reading!' )
        exit( 1 )

    print( 'command_reader.py: opening %s' % sys.argv[1] )
    pipeName = sys.argv[1]
    file_obj = open( pipeName, 'r', newline='' )
    
    print( 'command_reader.py: waiting for data in the pipe.' )

    while True:
      try:
        data = file_obj.read()

        if 0 == len(data):
          continue

        print( 'command_reader.py: data={}'.format( data ))

      except( Exception ) as e:
        print( "command_reader.py: Exception reading data:", e )
        continue


