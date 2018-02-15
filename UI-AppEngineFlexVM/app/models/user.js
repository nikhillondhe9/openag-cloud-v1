
// load the things we need
var bcrypt = require('bcrypt-nodejs');


//-----------------------------------------------------------------------------
// User model class
class User {
    constructor() {
        this.id = undefined;        // user's email address
        this.username = undefined;  // displayable user name
        this.password = undefined;  // encrypted password
        this.openag = false;        // privileged user?

        // TOTAL hack!  debugrob TODO.  later have an array of devices user manages
        this.DEVICE_ID = '288b5931-d089-43f0-b91f-32392ae72afb';
    }

    //-------------------------------------------------------------------------
    // generate a hash
    generateHash( password ) {
        return bcrypt.hashSync( password, bcrypt.genSaltSync(8), null );
    }

    //-------------------------------------------------------------------------
    // check if password is valid
    validatePassword( password ) {
        if( typeof password === 'undefined' ) {
            return false;
        }
        return bcrypt.compareSync( password, this.password );
    }
}


//-----------------------------------------------------------------------------
// create the model class for users and expose it to our app
module.exports = User;


