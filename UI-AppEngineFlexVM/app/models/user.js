// load the things we need
var bcrypt = require('bcrypt-nodejs');

const BigQuery = require('@google-cloud/bigquery');
const projectId = process.env.PROJECT_ID;
const datasetName = process.env.BQ_DATASET;
const userTableName = process.env.BQ_USER_TABLE;
const bq = BigQuery({ projectId: projectId });


//-----------------------------------------------------------------------------
// User model class
class User {
  constructor() {
    this.id = undefined;        // user's email address
    this.username = undefined;  // displayable user name
    this.password = undefined;  // encrypted password
    this.openag = false;        // privileged user?
  }

  // generate a hash
  generateHash( password ) {
    return bcrypt.hashSync( password, bcrypt.genSaltSync(8), null );
  }

  // check if password is valid
  validatePassword( password ) {
    if( typeof password === 'undefined' ) {
      return false;
    }
    return bcrypt.compareSync( password, this.password );
  }

  // findById( email, function(err, user) {} )
  static findById( id, callback ) {
    if( typeof id === 'undefined' ) {
      console.log( "findById: Passed invalid id." );
      return callback( null, null );
    }
    console.log( "debugrob: findById: " + id );

//debugrob: how to auth?
    //debugrob: do bq find
    var sql = `SELECT id,username,password,openag 
               FROM openag_private_webui.user WHERE id = ` + id;
    const options = {
      query: sql,
      timeoutMs: 10000,     // Time out after 10 seconds.
      useLegacySql: false,  // Use standard SQL syntax for queries.
    };
    bq.query(options)
      .then(results => {
        const rows = results[0];
        console.log('Rows:');
        rows.forEach(row => console.log(row));
      })
      .catch(err => {
        console.error('ERROR:', err);
      });

    // User not found.
//debugrob:
    if( id != 'rob@rob.rob' ) {
        return callback( null, null );
    }

    // Found the user, so return them.
    var u = new User();
    u.id = id;
    u.username = 'debugrob fill this in';
//debugrob crypted 'r' password
    u.password = '$2a$08$91xZ4QZ8bbIJ8I6VbXKcqOAowfs7Td0IczBRO9PyyZj112zv68onW';
    u.openag = false;    
    return callback( null, u );
  }

  //---------------------------------------------------------------------------
  // save( function(err) {} )
  save( callback ) {

//debugrob: handle id and password of undefined (null)
    console.log( "debugrob: save: " + this.id + ", " + this.username + 
        ", " + this.password + ", " + this.openag );
    return callback( null );

    //debugrob: do bq save, and call callback?
  }
}


//-----------------------------------------------------------------------------
// create the model class for users and expose it to our app
module.exports = User;


