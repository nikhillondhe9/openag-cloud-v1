#!/usr/bin/env python3

import os, time, json, argparse

#debugrob: play with using os.fdopen(fd) to read data.

#debugrob: Write a script that writes to the fd to simulate the brain writing sensor data.  name: N, type: T, value: V<CR>


#------------------------------------------------------------------------------
def main():

    # parse command line args
    parser = argparse.ArgumentParser()
    parser.add_argument( '--blah', type=str, help='blah',
                         default='def')
    parser.add_argument( '--meh', type=float, help='meh',
                         required=True )
    args = parser.parse_args()

    print('debugrob TBD');


#------------------------------------------------------------------------------
if __name__ == "__main__":
    main()




