// load the things we need
var bcrypt = require('bcrypt-nodejs');

//debugrob, can I use a non-streaming query?  BQ won't let me update/delete
// the user we insert with the exising code.  
// Try a job / load/import

//debugrob, put all this into a database.js class
const BigQuery = require('@google-cloud/bigquery');
const projectId = process.env.PROJECT_ID;
const userDatasetName = process.env.BQ_USER_DATASET;
const userTableName = process.env.BQ_USER_TABLE;
const dataDatasetName = process.env.BQ_DATA_DATASET
const valueTableName = process.env.BQ_VALUE_TABLE
const bq = BigQuery({ projectId: projectId });

console.log('PROJECT_ID:'+ projectId );
console.log('BQ_USER_DATASET:'+ userDatasetName );
console.log('BQ_USER_TABLE:'+ userTableName );
console.log('BQ_DATA_DATASET:'+ dataDatasetName );
console.log('BQ_VALUE_TABLE:'+ valueTableName );


//-----------------------------------------------------------------------------
// EnvVar class - move to its own file later debugrob.
class EnvVar {
  constructor() {
    this.experiment = '';
    this.treatment = '';
    this.device = 'test-rack'; //debugrob, hardcode for now
    this.time = '';
    this.variable = '';
    this.value = '';
  }
}

//-----------------------------------------------------------------------------
// User model class
class User {
  constructor() {
    this.id = undefined;        // user's email address
    this.username = undefined;  // displayable user name
    this.password = undefined;  // encrypted password
    this.openag = false;        // privileged user?
    this.envVars = new Array();
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
  // findById( email, getEnvVarData, function(err, user) {} )
  static findById( id, getEnvVarData, callback ) {
    if( typeof id === 'undefined' ) {
      console.log( "findById ERROR: Passed invalid id." );
      return callback( null, null );
    }

    // look up this user id (email) in our DB
    var sql = "SELECT id,username,password,openag " +
              "FROM " + userDatasetName + "." + userTableName + 
              " WHERE id = '" + id + "'";
    //console.log( "findById: sql='" + sql + "'" );
    const options = {
      query: sql,
      timeoutMs: 15000,     // Time out after 15 seconds.
      useLegacySql: false,  // Use standard SQL syntax for queries.
    };

    // This is an ASYNCHRONOUS query, 
    // so you must wait and process the query results inside the 
    // dynamic callback function when it is eventually called.
    bq.query( options, function( err, rows ) {
      if( err ) {
        console.error('findById ERROR:', err);
        return;
      }
      //rows.forEach(row => console.log(row));

      if( rows.length == 0 ) {
        // User not found, return no error (null) and no User (null).
        console.error('findById user \'' + id + '\' not found.');
        return callback( null, null );
      }

      // We have at least one row that should be the User we searched for.
      const row = rows[0];
      var u = new User();
      u.id       = row.id;
      u.username = row.username;
      u.password = row.password;
      u.openag   = row.openag;
      console.log('findById found user \'' + u.id + '\'' );

      // if we don't need to get the env var data, just return here.
      if( ! getEnvVarData ) {
        return callback( null, u );
      }
      // later move this elsewhere.  
      // no beuno haveing a query with async callback inside the same...
      // just get the last env var and stick it on the user for now.
      var sql = 
      "CREATE TEMPORARY FUNCTION  "+
      "  isFloat(type STRING) AS (TRIM(type) = 'float'); "+
      "CREATE TEMPORARY FUNCTION  "+
      "  getFloatAsStr(fval FLOAT64, ival INT64, sval STRING) AS  "+
      "    (CAST( fval AS STRING)); "+
      "CREATE TEMPORARY FUNCTION  "+
      "  isInt(type STRING) AS (TRIM(type) = 'int'); "+
      "CREATE TEMPORARY FUNCTION  "+
      "  getIntAsStr(fval FLOAT64, ival INT64, sval STRING) AS  "+
      "    (CAST( ival AS STRING)); "+
      "CREATE TEMPORARY FUNCTION  "+
      "  isString(type STRING) AS (TRIM(type) = 'string'); "+
      "CREATE TEMPORARY FUNCTION  "+
      "  getString(fval FLOAT64, ival INT64, sval STRING) AS (TRIM(sval)); "+
      "CREATE TEMPORARY FUNCTION  "+
      "  getValAsStr(type STRING, fval FLOAT64, ival INT64, sval STRING) AS ( "+
      "  IF( isFloat(type), getFloatAsStr(fval,ival,sval),  "+
      "    IF( isInt(type), getIntAsStr(fval,ival,sval), "+
      "      IF( isString(type), getString(fval, ival, sval), NULL)))); "+
      "SELECT "+
      "    REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){0}([^~]*)\") as Experiment, "+
      "    REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){2}([^~]*)\") as Treatment, "+
      "    REGEXP_EXTRACT(id, r\"(?:[^\~]*\~){3}([^~]*)\") as Name, "+
      "    FORMAT_TIMESTAMP( '%c', TIMESTAMP( "+
      "      REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), "+
      "        'America/New_York') as Time, "+
      "    getValAsStr(type,fval,ival,sval) as Value "+
      "  FROM " + dataDatasetName + "." + valueTableName +
      "  ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC "+
      "  LIMIT 5 ";

      //console.log( "findById EnvVars: sql='" + sql + "'" );
      const options = {
        query: sql,
        timeoutMs: 20000,     // Time out after 20 seconds.
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
          // no data found!
          console.log('findById no env vars.');
          return;
        }

        // Process the rows (this is 95% faster than rows.forEach() )
        for( var i=0; i < rows.length; i++ ) { 
          var e = new EnvVar();
          e.experiment = rows[i].Experiment;
          e.treatment = rows[i].Treatment;
          e.variable = rows[i].Name;
          e.time = rows[i].Time;
          e.value = rows[i].Value;
          u.envVars.push( e );
          console.log('findById EnvVar['+i+'] '+e.time+' '+e.variable+' '+e.value);
        }


//must return from this inner async callback, so the browser waits until all the data is back.
        // return no error (null) and the User we found.
        console.log('findById calling callback with valid user.');
        return callback( null, u );
      });

      // return no error (null) and the User we found.
      console.log('findById done finding user.');
//      return callback( null, u );
    });
  }

  //---------------------------------------------------------------------------
  // save( function(err) {} )
  save( callback ) {

    var dataset = bq.dataset( userDatasetName );
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
        console.log('saved user \''+ this.username + '\'');
        return callback( null );
      })
      .catch(err => {
        if (err && err.name === 'PartialFailureError') {
          if (err.errors && err.errors.length > 0) {
            console.log('save Insert errors:');
            err.errors.forEach(err => console.error(err));
          }
        } else {
          console.error('save ERROR:', err);
        }
      });

/*debugrob log all the rows of the user table
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
}


//-----------------------------------------------------------------------------
// create the model class for users and expose it to our app
module.exports = User;


