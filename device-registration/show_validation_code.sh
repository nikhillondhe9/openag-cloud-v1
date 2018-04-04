#!/bin/bash

FILE='rsa_cert.pem'
if [ ! -f $FILE ]; then
    echo "Error: The $FILE needs to be in the current directory."
    exit 1
fi

# Python to generate the checksum we show the user as a "validation code"
CKSUM=`python3 -c "import zlib
fn = \"$FILE\"
with open( fn, 'r' ) as f:
  key_file_contents = f.read()
cksum = zlib.crc32( key_file_contents.encode('utf-8') )
print( '{:X}'.format( cksum ))"`

echo "Please enter this verification code into the UI:"
echo $CKSUM


