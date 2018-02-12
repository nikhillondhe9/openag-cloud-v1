// load up the user model
var User = require('../app/models/user');

module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the login/create account page.
    app.get('/', function(req, res) {
        console.log('route index');
        res.render('index.ejs');
    });

    // home page.
    app.get('/home', isLoggedIn, function(req, res) {
        console.log('route home render home page');
        User.getEnvVarData( req.user, function( err, userWithEnvVars ) {
            res.render('home.ejs', {
                user : userWithEnvVars
            });
        });
    });

    // configure treatment page.
    app.get('/configure', isLoggedIn, function(req, res) {
        console.log('route configure render configure page');
        res.render('configure.ejs', {
            user : req.user
        });
    });

    // process the configure form
    app.post('/configure', function(req, res) {
        console.log('post configure' + JSON.stringify(req.body, null, 2));
        var1 = req.body.var1;
        var2 = req.body.var2;
        sched1 = req.body.sched1;
        sched2 = req.body.sched2;
//debugrob: use form data to decide what to send (reset+vars+recipe)
        var user = req.user;
        user.sendReset( function(err) {
            //res.redirect('/configure'); // don't need this async func.
            //debugrob: write a message to the page?
        });
        res.redirect('/configure');
    });

/*debugrob: works: the /configure route/button calls this code
    app.get('/configure', isLoggedIn, function(req, res) {
        console.log('route configure call user.sendReset()');
        var user      = req.user;
        user.sendReset( function(err) {
            res.redirect('/home');
        });
    });
*/

    // run treatment page.
    app.get('/run', isLoggedIn, function(req, res) {
        console.log('route run render run page');
        res.render('run.ejs', {
            user : req.user
        });
    });

    // stop treatment page.
    app.get('/stop', isLoggedIn, function(req, res) {
        console.log('route stop render stop page');
        res.render('stop.ejs', {
            user : req.user
        });
    });

    // status page.
    app.get('/status', isLoggedIn, function(req, res) {
        console.log('route status render status page');
        res.render('status.ejs', {
            user : req.user
        });
    });

    // logout action and go back to login page.
    app.get('/logout', function(req, res) {
        console.log('route logout');
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // LOGIN ===============================
    // show the login form
    app.get('/login', function(req, res) {
        console.log('route get login');
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/home', // redirect to the secure home section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/home', // redirect to the secure home section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

/*debugrob, called by an anchor link on the home.ejs view.
 * Example of how a button on a page can call code.

    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user      = req.user;
        user.id       = undefined;
        user.password = undefined;
        user.save(function(err) {
            res.redirect('/home');
        });
    });
*/

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        //console.log('route isLoggedIn yes, is auth, calling next');
        return next();
    }

    //console.log('route isLoggedIn redirect to /');
    res.redirect('/');
}


