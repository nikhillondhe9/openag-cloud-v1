#!/usr/bin/env python3

# Write out CSV lines to a named pipe which blocks until a reader opens it.

import os, sys, csv, time, json, argparse

#------------------------------------------------------------------------------
def main():

    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--lines', type=int, help='number of lines to write',
                         default='10')
    parser.add_argument( '--delay_secs', type=float, 
                         help='number of secs to delay between writes', 
                         default='1.0')
    parser.add_argument( '--pipe_name', type=str, help='named pipe name',
                         default='values.pipe')
    args = parser.parse_args()

    # Create/open a NAMED PIPE for writing.
    if not os.path.exists( args.pipe_name ):
        #print( 'Making pipe: ' + args.pipe_name )
        os.mkfifo( args.pipe_name )

    value = 0.0
    for t in range( 0, args.lines ):

        # We will block here until a reader opens the pipe and starts reading.
        #print( 'Opening pipe: ' + args.pipe_name )
        p = open( args.pipe_name, 'w', newline='' )
        writer = csv.writer( p );

        value += 1.1
        print( 'Writing %f' % value )
        writer.writerow( [ 'CO2', 'float', str(value) ] )
        p.close()

        time.sleep( args.delay_secs )



#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




