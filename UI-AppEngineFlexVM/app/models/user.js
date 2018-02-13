
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


