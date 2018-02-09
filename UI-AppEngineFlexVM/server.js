// server.js

//debugrob: Optimizations for later:
//  Add DB class for BQ code.  Make streaming and batch DB methods.

//debugrob: Need for perf?: 
//  Upon startup, check memcache, if empty, load all users from BQ.
//  change my DB class to be a write-through memcache to BQ.
//  change my DB class to only read from memcache (for speed).


// set up ======================================================================
// get all the modules we will use
var express        = require( 'express');
var app            = express();
var port           = process.env.PORT || 8080;
var passport       = require( 'passport');
var flash          = require( 'connect-flash');
var morgan         = require( 'morgan');
var cookieParser   = require( 'cookie-parser');
var bodyParser     = require( 'body-parser');
var session        = require( 'express-session'); 
var MemcachedStore = require( 'connect-memjs')( session );

// configuration ===============================================================
require( './config/passport')( passport ); // pass passport for configuration

// set up our express application
app.use( morgan( 'dev')); // log every request to the console
app.use( cookieParser()); // read cookies (needed for auth)
app.use( bodyParser.json()); // get information from html forms
app.use( bodyParser.urlencoded({ extended: true }));

app.set( 'view engine', 'ejs'); // set up ejs for templating

// A session cache is REQUIRED for passport.
// Environment variables are defined in app.yaml for production.
let MEMCACHE_URL = process.env.MEMCACHE_URL || '127.0.0.1:11211';

// For the future, when GAE flex env has memcached (not yet).
if( process.env.USE_GAE_MEMCACHE ) {
    MEMCACHE_URL = `${process.env.GAE_MEMCACHE_HOST}:${process.env.GAE_MEMCACHE_PORT}`;
    console.log('Using GAE session cache: ' + MEMCACHE_URL );
} else {
    console.log('Using session cache: ' + MEMCACHE_URL );
}

app.use(session({
    secret: '1LoveF00dDoY00L00eF000Organ1cYummyF000', // session secret
    cookie: { maxAge: 300000 }, // 5 minute session timeout
    key: 'view:count',
    proxy: 'true',
    resave: 'true',
    saveUninitialized: 'true',
    store: new MemcachedStore({
        servers: [MEMCACHE_URL], 
        username: [process.env.MEMCACHE_USERNAME],
        password: [process.env.MEMCACHE_PASSWORD]
    })
}));

// set up passport
app.use( passport.initialize());
app.use( passport.session()); // persistent login sessions
app.use( flash()); // use connect-flash for flash messages stored in session

// load our routes and pass in our app and fully configured passport
require( './app/routes.js')( app, passport ); 

// launch ======================================================================
app.listen( port );
console.log( 'open http://localhost:' + port );


