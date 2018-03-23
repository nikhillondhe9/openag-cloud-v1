#!/usr/bin/env python3

import argparse, sys, os, logging, traceback, zlib


#------------------------------------------------------------------------------
def parse_command_line_args():
    parser = argparse.ArgumentParser(description=(
            'Registration public key publisher.'))
    parser.add_argument(
            '--public_key_file',
            required=True, help='Path to public key file.')
    parser.add_argument( '--log', type=str, 
        help='log level: debug, info, warning, error, critical', 
        default='error' )
    return parser.parse_args()


#------------------------------------------------------------------------------
def main():
    logging.basicConfig( level=logging.ERROR ) # can only call once

    args = parse_command_line_args()

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % \
                args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )

    # read in the args.public_key_file
    with open( args.public_key_file, 'r' ) as f:
        key_file_contents = f.read()

    cksum = zlib.crc32( key_file_contents.encode('utf-8') )

    print( "checksum of {}: {:X}".format( args.public_key_file, cksum ))


#------------------------------------------------------------------------------
if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception: %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


