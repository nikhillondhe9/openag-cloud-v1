// server.js

/*debugrob: Do First: 
    Add a new view that shows the latest values from the test env. data.
    Get latest value by time.
    On home.ejs view:
        Experiment:            
        Treatment:            
        Device:            
        Time:            
        Name:            
        Value:            
*/

//debugrob: Optimizations for later:
//debugrob: Add synchronous batch job user insert to app/models/user.js - save existing stream insert code.

//debugrob: Add DB class for BQ code.
//debugrob: Use config/database.js to configure above.

//debugrob: Upon startup, check memcache, if empty, load all users from BQ.
//debugrob: change my DB class to be a write-through memcache to BQ.
//debugrob: change my DB class to only read from memcache (for speed).


// set up ======================================================================
// get all the tools we need
var express      = require('express');
var app          = express();
var port         = process.env.PORT || 8080;
var passport     = require('passport');
var flash        = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

//debugrob: unused for now, put our BQ config there
var configDB = require('./config/database.js');

// configuration ===============================================================
//debugrob: make this the BQ config based on env vars?
//mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'ilovefooddoyoulovefoodorganicyummyfood', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('open http://localhost:' + port);


