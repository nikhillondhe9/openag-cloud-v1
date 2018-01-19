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


//debugrob: put in some common util.js
//-----------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//-----------------------------------------------------------------------------
//debugrob, as a quick hack, add a function to get the latest values for display to the User class.  Later, after I make a common DB class, move EnvVars class to its own .js file.
class EnvVars {
  constructor() {
    this.experiment = '';
    this.treatment = '';
    this.device = 'test'; //debugrob, hardcode for now
    this.time = '';
    this.name = '';
    this.value = '';
  }

  async getData() {
    // get the latest value
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
      "  LIMIT 1 ";

    //console.log( "EnvVars: sql='" + sql + "'" );
    const options = {
      query: sql,
      timeoutMs: 10000,     // Time out after 10 seconds.
      useLegacySql: false,  // Use standard SQL syntax for queries.
    };

    // Outer scope variable for use in the async callback below.
    // This is how to get around the promise BS.
    let ev = this;
//debugrob: 
    ev.time = undefined;

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
        return;
      }

      // Process the rows (this is 95% faster than rows.forEach() )
      //for( var i=0; i < rows.length; i++ ) { }

      ev.experiment = rows[0].Experiment;
      ev.treatment = rows[0].Treatment;
      ev.name = rows[0].Name;
      ev.time = rows[0].Time;
      ev.value = rows[0].Value;
      console.log('EnvVars found: '+ev.time+' '+ev.name+' '+ev.value);
    });

//debugrob: there has to be a better way!
    // spin here until the above async query is done
    while( undefined == ev.time ) {
      console.log('sleeping...')
      await sleep( 1000 );
    }

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
    this.envvars = new EnvVars();
  }

  //---------------------------------------------------------------------------
  // debugrob temp hack
  getEnvVarData() {
    this.envvars.getData();
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
              "FROM " + userDatasetName + "." + userTableName + 
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

      // also get the latest env var data
      u.getEnvVarData();

      // return no error (null) and the User we found.
      return callback( null, u );
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


