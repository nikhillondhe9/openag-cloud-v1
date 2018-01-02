#!/usr/bin/env python3

# Read CSV lines from a named pipe created by the writer process.

import os, sys, csv, time, json, argparse


#------------------------------------------------------------------------------
def main():

    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--pipe_name', type=str, help='named pipe name',
                         default='values.pipe')
    args = parser.parse_args()

    if not os.path.exists( args.pipe_name ):
        print( 'The named pipe: ' + args.pipe_name + 
            ' doesn\'t exist, start the writer processs which creates it.' )
        exit( 1 )

    # run forever
    while True:
        print( 'Opening pipe: ' + args.pipe_name )
        p = open( args.pipe_name, 'r', newline='' )

        # this will block if there is nothing to read
        print( 'Reading from pipe...' )
        for row in csv.reader( p ):
            print( row )
        p.close()



#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




