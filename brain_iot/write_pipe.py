#!/usr/bin/env python3

import argparse, sys, os, logging, traceback, time


#------------------------------------------------------------------------------
def parse_command_line_args():
    logging.basicConfig( level=logging.DEBUG ) # can only call once

    parser = argparse.ArgumentParser(description=(
            'pipe writing test.'))
    parser.add_argument(
            '--pipe',
            default='data.fifo',
            #required=True, 
            help='Path to pipe to write.')
    parser.add_argument( '--log', type=str, 
        help='log level: debug, info, warning, error, critical', 
        default='debug' )

    args = parser.parse_args()

    # user specified log level
    numeric_level = getattr( logging, args.log.upper(), None )
    if not isinstance( numeric_level, int ):
        logging.critical('publisher: Invalid log level: %s' % \
                args.log )
        numeric_level = getattr( logging, 'ERROR', None )
    logging.getLogger().setLevel( level=numeric_level )

    return args



#------------------------------------------------------------------------------
def main():
    args = parse_command_line_args()

    logging.debug( 'opening: %s' % args.pipe )
    with open( args.pipe, 'wb' ) as pipe:
        bytestr = '{"command_reply": "debugrob", ' \
                  ' "values": ' \
                  '   "{\'values\': [ ' \
                  '      {\'name\':\'rob\', ' \
                  '       \'type\':\'string\', ' \
                  '       \'value\':\'meh\'} ' \
                  '      ] ' \
                  '   }"' \
                  '}'.encode( 'utf-8' )
        pipe.write( bytestr )
        logging.debug( 'wrote: {} to the pipe {}'.format( bytestr, args.pipe ))
        #print( 'now sleeping for 10 minutes to keep the writer side of the pipe open' )
        #time.sleep( 600 )
        #print( 'done sleeping, this may mess up the code that reads the pipe.')



#------------------------------------------------------------------------------
if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.critical( "Exception: %s" % e)
        traceback.print_tb( exc_traceback, file=sys.stdout )


