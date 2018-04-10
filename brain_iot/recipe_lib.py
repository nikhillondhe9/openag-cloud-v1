#!/usr/bin/env python3

# Common local function library for python (3).

# import like this:
# from recipe_lib import Recipe

import sys, struct, json, traceback, logging


# These constant values MUST match the ones in openag_data.h
OA_DATA_TYPE_FLOAT  = 4
OA_DATA_TYPE_UINT32 = 5
OA_DATA_TYPE_INT    = 6
OA_DATA_TYPE_BYTE_A = 10

# These constant values MUST match the ones in openag_recipe.h
MAX_NUM_CYCLES_PER_RECIPE = 4
MAX_NUM_STEPS_PER_CYCLE   = 100


#------------------------------------------------------------------------------
class Recipe:
    def __init__( self ):
        self.dtype = OA_DATA_TYPE_FLOAT # 1 byte uint
        self.measurement_period_ms = 0  # 4 byte uint
        self.num_cycles = 0             # 2 byte uint
        self.curr_cycle = 0             # 2 byte uint
        self.cycles = []
        for r in range( 0, MAX_NUM_CYCLES_PER_RECIPE ):
            self.cycles.append( Cycle() )   # add empty cycles

    def readFromBinaryFile( self, f ):
        self.dtype = readUint8( f )
        self.measurement_period_ms = readUint32( f )
        self.num_cycles = readUint16( f )
        self.curr_cycle = readUint16( f )
        for c in self.cycles:
            c.readFromBinaryFile( f, self.dtype )
        return True

    def readFromJSONFile( self, fileName ):
        try:
            f = open( fileName, 'r' ) # read text file
            jsonStr = f.read() # read entire file
            f.close()
            self.readJSONstring( jsonStr )
        except( Exception ) as e:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            logging.error( e )
            traceback.print_tb( exc_traceback, file=sys.stdout )
            return False
        return True

    def readJSONstring( self, jsonStr ):
        d = json.loads( jsonStr ) # convert json to a dict
        self.readFromDict( d )
        return True

    def readFromDict( self, d ):
        self.dtype = checkDictKeyInt( d, 'dtype' )
        self.measurement_period_ms = \
                checkDictKeyInt( d, 'measurement_period_ms' )
        self.num_cycles = checkDictKeyInt( d, 'num_cycles' )
        self.curr_cycle = checkDictKeyInt( d, 'curr_cycle' )
        # loop on two variables at the same time
        for c, d in zip( self.cycles, d['cycles'] ):
            c.readFromDict( d, self.dtype )
        return True

    def writeBinaryFile( self, fileName ):
        try:
            f = open( fileName, 'wb' ) # write binary file
            writeUint8( f, self.dtype )
            writeUint32( f, self.measurement_period_ms )
            writeUint16( f, self.num_cycles )
            writeUint16( f, self.curr_cycle )
            for c in self.cycles:
                c.writeBinaryFile( f, self.dtype )
        except( Exception ) as e:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            logging.error( e )
            traceback.print_tb( exc_traceback, file=sys.stdout )
            return False
        f.close()
        return True

    def display( self ):
        logging.info( 'recipe.dtype %d' % self.dtype )
        logging.info( 'recipe.measurement_period_ms %d' % \
                self.measurement_period_ms )
        logging.info( 'recipe.num_cycles %d' % self.num_cycles )
        logging.info( 'recipe.curr_cycle %d' % self.curr_cycle )
        i = 0
        for c in self.cycles:
            c.display( i )
            i += 1

    def makeJSON( self ):
        jsonStr = '{ "dtype": "%d", ' \
                  '"measurement_period_ms": "%d", ' \
                  '"num_cycles": "%d", ' \
                  '"curr_cycle": "%d", ' \
                  '"cycles": [ ' % \
            ( self.dtype, self.measurement_period_ms, 
              self.num_cycles, self.curr_cycle )
        i = 0
        for c in self.cycles:
            jsonStr = c.makeJSON( jsonStr, self.dtype )
            i += 1
            if i < len( self.cycles ):
                jsonStr += ','
        jsonStr += ']}'
        return jsonStr


#------------------------------------------------------------------------------
class Cycle:
    def __init__( self ):
        self.num_steps = 0      # 2 byte uint
        self.num_repeats = 0    # 2 byte uint
        self.curr_step = 0      # 2 byte uint
        self.curr_repeat = 0    # 2 byte uint
        self.steps = []
        for r in range( 0, MAX_NUM_STEPS_PER_CYCLE ):
            self.steps.append( Step() )     # add empty steps

    def readFromBinaryFile( self, f, dtype ):
        self.num_steps = readUint16( f )
        self.num_repeats = readUint16( f )
        self.curr_step = readUint16( f )
        self.curr_repeat = readUint16( f )
        for s in self.steps:
            s.readFromBinaryFile( f, dtype )

    def readFromDict( self, d, dtype ):
        self.num_steps   = checkDictKeyInt( d, 'num_steps' )
        self.num_repeats = checkDictKeyInt( d, 'num_repeats' )
        self.curr_step   = checkDictKeyInt( d, 'curr_step' )
        self.curr_repeat = checkDictKeyInt( d, 'curr_repeat' )
        # loop on two variables at the same time
        for s, d in zip( self.steps, d['steps'] ):
            s.readFromDict( d, dtype )

    def writeBinaryFile( self, f, dtype ):
        writeUint16( f, self.num_steps )
        writeUint16( f, self.num_repeats )
        writeUint16( f, self.curr_step )
        writeUint16( f, self.curr_repeat )
        for s in self.steps:
            s.writeBinaryFile( f, dtype )

    def display( self, idx ):
        logging.info( '      .cycle[%d].num_steps %d' % (idx, self.num_steps ))
        logging.info( '      .cycle[%d].num_repeats %d' % \
                (idx, self.num_repeats ))
        logging.info( '      .cycle[%d].curr_step %d' % (idx, self.curr_step ))
        logging.info( '      .cycle[%d].curr_repeat %d' % \
                (idx, self.curr_repeat ))
        i = 0
        for s in self.steps:
            s.display( i )
            i += 1

    def makeJSON( self, jstr, dtype ):
        jsonStr = jstr
        jsonStr += '{ "num_steps": "%d", ' \
                   '"num_repeats": "%d", ' \
                   '"curr_step": "%d", ' \
                   '"curr_repeat": "%d", "steps": [ ' % \
                  ( self.num_steps, self.num_repeats, \
                    self.curr_step, self.curr_repeat )
        i = 0
        for s in self.steps:
            jsonStr = s.makeJSON( jsonStr, dtype )
            i += 1
            if i < len( self.steps ):
                jsonStr += ','
        jsonStr += ']}'
        return jsonStr


#------------------------------------------------------------------------------
class Step:
    def __init__( self ):
        self.set_point = 0              # 24 byte union
        self.duration = 0               # 4 byte uint
        
    def readFromBinaryFile( self, f, dtype ):
        if OA_DATA_TYPE_FLOAT == dtype:
            self.set_point = readFloatFromUnion( f )
            readIgnore( f, 20 ) # read 4 bytes, ignore remaining 20
        elif OA_DATA_TYPE_UINT32 == dtype or \
             OA_DATA_TYPE_INT == dtype:
            self.set_point = readUint32( f )
            readIgnore( f, 20 ) # read 4 bytes, ignore remaining 20
        elif OA_DATA_TYPE_BYTE_A == dtype:
            self.set_point = read8BytesFromUnion( f )
            readIgnore( f, 16 ) # read 8 bytes, ignore remaining 16
        else:
            logging.error('invalid dtype: %d' % self.dtype)
            return
        self.duration = readUint32( f )

    def readFromDict( self, d, dtype ):
        if OA_DATA_TYPE_FLOAT == dtype:
            self.set_point = checkDictKeyFloat( d, 'set_point' )
        elif OA_DATA_TYPE_UINT32 == dtype or \
             OA_DATA_TYPE_INT == dtype:
            self.set_point = checkDictKeyInt( d, 'set_point' )
        elif OA_DATA_TYPE_BYTE_A == dtype:
            self.set_point = checkDictKeyBytes( d, 'set_point' )
        else:
            logging.error('invalid dtype: %d' % self.dtype)
            return
        if None == self.set_point:
            logging.error('invalid set_point: None')
        self.duration  = checkDictKeyInt( d, 'duration' )

    def writeBinaryFile( self, f, dtype ):
        if None == self.set_point:
            logging.error('invalid set_point: None')
            return
        if OA_DATA_TYPE_FLOAT == dtype:
            writeFloat( f, self.set_point ) # write a 4 byte float / 24b union
            writeZeros( f, 20 )             # write 20 bytes of zeros
        elif OA_DATA_TYPE_UINT32 == dtype or \
             OA_DATA_TYPE_INT == dtype:
            self.set_point = checkDictKeyInt( d, 'set_point' )
            writeUint32( f, self.set_point ) # write a 4 byte int / 24b union
            writeZeros( f, 20 )              # write 20 bytes of zeros
        elif OA_DATA_TYPE_BYTE_A == dtype:
            if type(self.set_point) is not bytearray:
                #logging.error('not bytearray set_point: %s' % self.set_point )
                return
            f.write( self.set_point )                   # already bytes
            writeZeros( f, 24 - len(self.set_point) )   # write zeros
        writeUint32( f, self.duration )

    def display( self, idx ):
        logging.info( '               .step[%d].set_point %f' % \
                (idx, self.set_point))
        logging.info( '               .step[%d].duration %d' % \
                (idx, self.duration))

    def makeJSON( self, jstr, dtype ):
        jsonStr = jstr
        if OA_DATA_TYPE_FLOAT == dtype:
            jsonStr += '{ "set_point": "%f", "duration": "%d" }' % \
                  ( self.set_point, self.duration )
        elif OA_DATA_TYPE_UINT32 == dtype or \
             OA_DATA_TYPE_INT == dtype:
            jsonStr += '{ "set_point": "%d", "duration": "%d" }' % \
                  ( self.set_point, self.duration )
        elif OA_DATA_TYPE_BYTE_A == dtype:
            # write JSON compatible array of 8 bytes
            jsonStr += '{ "set_point": ['
            first = True
            for c in self.set_point:
                if not first:
                    jsonStr += ','
                jsonStr += '"'
                jsonStr += c   # should write the byte out as int (255)
                jsonStr += '"'
                first = False
            jsonStr += ']}'
        else:
            logging.error('invalid dtype: %d' % self.dtype)
            return

        return jsonStr


#------------------------------------------------------------------------------
# read 8 bits, 1 byte from the file and return a uint8
def readUint8( f ):
    uint_bytes = f.read( 1 )  # read 1 byte
    return int.from_bytes( uint_bytes, byteorder='little', signed=False )


#------------------------------------------------------------------------------
# write a 1 byte int to the binary file.
def writeUint8( f, uint ):
    uint_bytes = uint.to_bytes( 1, byteorder='little', signed=False )
    f.write( uint_bytes )
    

#------------------------------------------------------------------------------
# read 16 bits, 2 bytes from the file and return a uint16
def readUint16( f ):
    uint_bytes = f.read( 2 )  # read two bytes
    return int.from_bytes( uint_bytes, byteorder='little', signed=False )


#------------------------------------------------------------------------------
# write a 2 byte int to the binary file.
def writeUint16( f, uint ):
    uint_bytes = uint.to_bytes( 2, byteorder='little', signed=False )
    f.write( uint_bytes )
    

#------------------------------------------------------------------------------
# read 32 bits, 4 bytes from the file and return a uint32
def readUint32( f ):
    uint_bytes = f.read( 4 )  # read four bytes
    return int.from_bytes( uint_bytes, byteorder='little', signed=False )


#------------------------------------------------------------------------------
# write a 4 byte int to the binary file.
def writeUint32( f, uint ):
    uint_bytes = uint.to_bytes( 4, byteorder='little', signed=False )
    f.write( uint_bytes )
    

#------------------------------------------------------------------------------
# read 4 bytes from the file and return a float.
def readFloatFromUnion( f ):
    float_bytes = f.read( 4 )  # read four bytes
    tup = struct.unpack( 'f', float_bytes )
    return tup[0]

#------------------------------------------------------------------------------
# read 8 bytes from the file and return a byte array
def read8BytesFromUnion( f ):
    ba = f.read( 8 ) # this returns a byte array already
    return ba

#------------------------------------------------------------------------------
# used to read the bytes we don't care about in the 24 byte union
# (after we read the first 4 bytes that are the float value)
def readIgnore( f, count ):
    f.read( count )  # read count bytes


#------------------------------------------------------------------------------
# write a 4 byte float to the binary file.
def writeFloat( f, fval ):
    float_bytes = struct.pack( 'f', fval )
    f.write( float_bytes )

#------------------------------------------------------------------------------
# write count zeros to the binary file.
def writeZeros( f, count ):
    zbytes = (0).to_bytes( count, byteorder='little', signed=False )
    f.write( zbytes )

#------------------------------------------------------------------------------
# check that the key is in the dict, if so return it as an int.  if not 0.
def checkDictKeyInt( d, key ):
    if key in d:
        return int( d[key] )
    return 0 # default for key not found

#------------------------------------------------------------------------------
# check that the key is in the dict, if so return it as a float.  if not 0.
def checkDictKeyFloat( d, key ):
    if key in d:
        return float( d[key] )
    return 0 # default for key not found

#------------------------------------------------------------------------------
# check that the key is in the dict, if so return it as a string.  if not None.
def checkDictKeyStr( d, key ):
    if key in d:
        return str( d[key] )
    return None # default for key not found

#------------------------------------------------------------------------------
# check that the key is in the dict, if so return it as bytes.  if not None.
def checkDictKeyBytes( d, key ):
    if key not in d:
        return None # default for key not found
    try:
        if len( d[key] ) > 8: # max 8 bytes for LED (max in the union)
            return None 
        ba = bytearray()
        for b in d[key]:
            ba.append( int(b) )
        return ba
    except( Exception ) as e:
        logging.error('invalid bytes: %d' % d[key])
        return None # probably an int conversion error




