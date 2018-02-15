// load up models
const DB = require( '../app/models/db' );
const User = require( '../app/models/user' );
const Command = require( '../app/models/command' );


module.exports = function(app, passport) {

// normal routes ===============================================================

    //-------------------------------------------------------------------------
    // index: show the login/create account page.
    app.get( '/', function( req, res ) {
        //console.log( 'route index' );
        res.render( 'index.ejs', { pageName : undefined } );
    });


    //-------------------------------------------------------------------------
    // data page.
    app.get( '/data', isLoggedIn, function(req, res) {
        //console.log('route data render data page');
        DB.getEnvVarData( req.user.id, function( err, envVars ) {
            res.render( 'data.ejs', {
                user : req.user,
                envVars : envVars,
                pageName : 'data' 
            });
        });
    });


    //-------------------------------------------------------------------------
    // configure treatment page.
    const variables = [ "",
                        "co2_ccs811",
                        "co2_t6713",
                        "LED_panel",
                        "light_control",
                        "temp_humidity_htu20d",
                        "temp_humidity_sht25" ];
    const schedules = [ "",
                        "measure every 10 sec",
                        "LED disco set points",
                        "light control 800 LUX" ];
    app.get( '/configure', isLoggedIn, function(req, res) {
        //console.log('route configure render configure page');
        res.render('configure.ejs', {
            user : req.user,
            session : req.session,
            vars : variables,
            scheds : schedules,
            config_info : "",
            config_warning : "",
            pageName : 'configure' 
        });
    });

    // process (validate) the configure form
    app.post( '/configure', function(req, res) {
        //console.log('post configure' + JSON.stringify(req.body, null, 2));
        // store the form fields on the current session
        req.session.var1 = req.body.var1;
        req.session.var2 = req.body.var2;
        req.session.sched1 = req.body.sched1;
        req.session.sched2 = req.body.sched2;
        req.session.validConfiguration = false; 

        var1 = req.body.var1;
        var2 = req.body.var2;
        sched1 = req.body.sched1;
        sched2 = req.body.sched2;

        // only use one of these for user feedback
        infoMsg = ""
        warningMsg = "Invalid configuration, try again.";

        // validate fields
        valid = false;
        if(( 0 == var1.length && 0 == var2.length ) ||
           ( 0 == sched1.length && 0 == sched2.length )) {
            warningMsg = "You must pick a variable and a control set.";
        } else if(( var1 == variables[3] && sched1 != schedules[2] ) ||
                  ( var2 == variables[3] && sched2 != schedules[2] )) {
            warningMsg = "The LED_panel can only run the LED disco.";
        } else if(( var1 == variables[4] && sched1 != schedules[3] ) ||
                  ( var2 == variables[4] && sched2 != schedules[3] )) {
            warningMsg = 
                "The light_control can only run the light control set.";
        } else if(( var1 == variables[1] || var1 == variables[2] ||
                    var1 == variables[5] || var1 == variables[6] ) &&
                  ( sched1 != schedules[1] )) {
            warningMsg = "Sensors can only run the measure control set.";
        } else if(( var2 == variables[1] || var2 == variables[2] ||
                    var2 == variables[5] || var2 == variables[6] ) &&
                  ( sched2 != schedules[1] )) {
            warningMsg = "Sensors can only run the measure control set.";
        } else {
            valid = true;
        }

        if( valid ) {
            infoMsg = "Saved! Now <b><a href='/run'>Run</a></b> it.",
            warningMsg = "";
            req.session.validConfiguration = true;
            req.session.hideButton = false;
        }

        // a bit of clean up
        if( 0 == var1.length ) {
            req.session.sched1 = "";
        } 
        if( 0 == var2.length ) {
            req.session.sched2 = "";
        } 
        if( 0 == sched1.length ) {
            req.session.var1 = "";
        } 
        if( 0 == sched2.length ) {
            req.session.var2 = "";
        } 

        res.render( 'configure.ejs', {
            user : req.user,
            session : req.session,
            vars : variables,
            scheds : schedules,
            config_info : infoMsg,
            config_warning : warningMsg,
            pageName : 'configure' 
        });
    });


    //-------------------------------------------------------------------------
    // run treatment page.
    // view uses the saved session data for its display.
    app.get( '/run', isLoggedIn, function(req, res) {
        //console.log('route run render run page');
        infoMsg = "";
        warningMsg = "";
        res.render( 'run.ejs', {
            user : req.user,
            session : req.session,
            run_info : "",
            run_warning : "",
            pageName : 'run' 
        });
    });

    // process the run form
    app.post( '/run', function( req, res ) {
        if( ! req.session.validConfiguration ) {
            req.session.hideButton = true;
            res.render( 'run.ejs', {
                user : req.user,
                session : req.session,
                run_info : "",
                run_warning : "Can't Run an invalid Configuration.",
                pageName : 'run' 
            });
            return;
        }

        req.session.validConfiguration = true;
        req.session.hideButton = true;
        infoMsg = "Configuration sent to your device!";
        warningMsg = "";

        // Send the commands to the device and display result to user.
        cmds = Command.sendCommands( req.user,
                                     req.session.var1,
                                     req.session.var2,
                                     req.session.sched1,
                                     req.session.sched2,
                                     function( err ) {
            if( err ) {
                warningMsg = err;
                infoMsg = "";
            }
        });

        DB.saveCommand( req.user.id, req.user.DEVICE_ID, 
                        cmds, function( err ) {
            if( err ) {
                warningMsg = err;
                infoMsg = "";
            }
        });

        res.render( 'run.ejs', {
            user : req.user,
            session : req.session,
            run_info : infoMsg,
            run_warning : warningMsg,
            pageName : 'run' 
        });
    });


    //-------------------------------------------------------------------------
    // stop treatment page.
    app.get( '/stop', isLoggedIn, function(req, res) {
        //console.log('route stop render stop page');
        infoMsg = "";
        warningMsg = "";
        res.render( 'stop.ejs', {
            user : req.user,
            session : req.session,
            stop_info : "",
            stop_warning : "",
            pageName : 'stop' 
        });
    });

    // process the stop form
    app.post( '/stop', function( req, res ) {
        infoMsg = "Stop sent to your device!";
        warningMsg = "";

        // Send the commands to the device and display result to user.
        cmds = Command.sendStop( req.user, function( err ) {
            if( err ) {
                infoMsg = "";
                warningMsg = err;
            }
        });
        DB.saveCommand( req.user.id, req.user.DEVICE_ID, 
                        cmds, function( err ) {
            if( err ) {
                warningMsg = err;
                infoMsg = "";
            }
        });
        res.render( 'stop.ejs', {
            user : req.user,
            session : req.session,
            stop_info : infoMsg,
            stop_warning : warningMsg,
            pageName : 'stop' 
        });
    });


    //-------------------------------------------------------------------------
    // status page.
    app.get( '/status', isLoggedIn, function(req, res) {
        //console.log('route status render status page');
        infoMsg = "";
        warningMsg = "";
        res.render( 'status.ejs', {
            user : req.user,
            session : req.session,
            status_info : "",
            status_warning : "",
            pageName : 'status' 
        });
    });

    // process the status form
    app.post( '/status', function( req, res ) {
        infoMsg = "Status request sent to your device!";
        warningMsg = "";

        // Send the commands to the device and display result to user.
        cmds = Command.sendStatus( req.user, function( err ) {
            if( err ) {
                infoMsg = "";
                warningMsg = err;
            }
        });
        DB.saveCommand( req.user.id, req.user.DEVICE_ID, 
                        cmds, function( err ) {
            if( err ) {
                warningMsg = err;
                infoMsg = "";
            }
        });
        res.render( 'status.ejs', {
            user : req.user,
            session : req.session,
            status_info : infoMsg,
            status_warning : warningMsg,
            pageName : 'status' 
        });
    });

    //-------------------------------------------------------------------------
    // logout action and go back to login page.
    app.get( '/logout', function(req, res) {
        //console.log('route logout');
        req.logout();
        res.redirect('/');
    });


// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // LOGIN ===============================
    // show the login form
    app.get( '/login', function(req, res) {
        //console.log('route get login');
        res.render( 'login.ejs', { 
            message: req.flash('loginMessage'),
            pageName : undefined
        });
    });

    // process the login form
    app.post( '/login', passport.authenticate('local-login', {
        successRedirect : '/data', // redirect to the secure data section
        failureRedirect : '/login', // redirect to the login page if error
        failureFlash : true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get( '/signup', function(req, res) {
        res.render('signup.ejs', { 
            message: req.flash('signupMessage'),
            pageName : undefined
        });
    });

    // process the signup form
    app.post( '/signup', passport.authenticate('local-signup', {
        successRedirect : '/data', // redirect to the secure data section
        failureRedirect : '/signup', // redirect to the signup page if error
        failureFlash : true // allow flash messages
    }));
};


// Route middleware to ensure user is logged in
function isLoggedIn( req, res, next ) {
    if( req.isAuthenticated() ) {
        // user IS logged in
        return next();
    }

    // User is NOT logged in, so let them try again.  
    // Happens when session times out.
    res.redirect( '/' );
}


