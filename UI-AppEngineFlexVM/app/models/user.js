// load the things we need
var bcrypt = require('bcrypt-nodejs');

//debugrob, can I use a non-streaming query?  BQ won't let me update/delete
// the user we insert with the exising code.  
// Try a job / load/import

//debugrob, put all this into a database.js class
const BigQuery = require('@google-cloud/bigquery');
const projectId = process.env.PROJECT_ID;
const datasetName = process.env.BQ_DATASET;
const userTableName = process.env.BQ_USER_TABLE;
const bq = BigQuery({ projectId: projectId });

console.log('PROJECT_ID:'+ projectId );
console.log('BQ_DATASET:'+ datasetName );
console.log('BQ_USER_TABLE:'+ userTableName );


//-----------------------------------------------------------------------------
// User model class
class User {
  constructor() {
    this.id = undefined;        // user's email address
    this.username = undefined;  // displayable user name
    this.password = undefined;  // encrypted password
    this.openag = false;        // privileged user?
  }

  //---------------------------------------------------------------------------
  // generate a hash
  generateHash( password ) {
    return bcrypt.hashSync( password, bcrypt.genSaltSync(8), null );
  }

  //---------------------------------------------------------------------------
  // check if password is valid
  validatePassword( password ) {
    if( typeof password === 'undefined' ) {
      return false;
    }
    return bcrypt.compareSync( password, this.password );
  }

  //---------------------------------------------------------------------------
  // findById( email, function(err, user) {} )
  static findById( id, callback ) {
    if( typeof id === 'undefined' ) {
      console.log( "ERROR: findById: Passed invalid id." );
      return callback( null, null );
    }

    // look up this user id (email) in our DB
    var sql = "SELECT id,username,password,openag " +
              "FROM " + datasetName + "." + userTableName + 
              " WHERE id = '" + id + "'";
    //console.log( "findById: sql='" + sql + "'" );
    const options = {
      query: sql,
      timeoutMs: 10000,     // Time out after 10 seconds.
      useLegacySql: false,  // Use standard SQL syntax for queries.
    };

    // This is an ASYNCHRONOUS query, 
    // so you must wait and process the query results inside the 
    // dynamic callback function when it is eventually called.
    bq.query( options, function( err, rows ) {
      if( err ) {
        console.error('ERROR:', err);
        return;
      }
      //rows.forEach(row => console.log(row));

      if( rows.length == 0 ) {
        // User not found, return no error (null) and no User (null).
        return callback( null, null );
      }

      // We have at least one row that should be the User we searched for.
      const row = rows[0];
      var u = new User();
      u.id       = row.id;
      u.username = row.username;
      u.password = row.password;
      u.openag   = row.openag;
      //console.log('found u.id: '+u.id);

      // return no error (null) and the User we found.
      return callback( null, u );
    });
  }

  //---------------------------------------------------------------------------
  // save( function(err) {} )
  save( callback ) {

    var dataset = bq.dataset( datasetName );
    var table = dataset.table( userTableName );

    // Make JSON rows of data (only one row/user).
    const rows = [{ id: this.id, 
                    username: this.username, 
                    password: this.password,
					created: bq.timestamp(new Date()),
                    openag: false }];

//debugrob, find another way - load job.  But save this code in new DB class and name "streamingUserInsert()" with comments below.
    // This is a STREAMING insert, which means that the data can't be 
    // deleted or updated in BQ for 24 hours.  
    table.insert( rows ).then( () => {
        // return no error (null).
        return callback( null );
      })
      .catch(err => {
        if (err && err.name === 'PartialFailureError') {
          if (err.errors && err.errors.length > 0) {
            console.log('Insert errors:');
            err.errors.forEach(err => console.error(err));
          }
        } else {
          console.error('ERROR:', err);
        }
      });

/* log all the rows of the user table
    table.getRows().then( results => {
        const rows = results[0];
        console.log('Rows:');
        rows.forEach(row => console.log(row));
      })
      .catch(err => {
        console.error('ERROR:', err);
      });
*/
}


//-----------------------------------------------------------------------------
// create the model class for users and expose it to our app
module.exports = User;


