
var LocalStrategy    = require('passport-local').Strategy;
var User       = require('../app/models/user');

module.exports = function(passport) {

    // serialize the user
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    /* Local Signup */

    passport.use('local-signup', new LocalStrategy({
          // Using email as username and password
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        process.nextTick(function() {
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // error handling
            if (err)
                return done(err);

            // check to see if user already exist
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

              /* Creates new user*/
                var newUser            = new User();
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);

                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }

        });

        });

    }));

    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {

      // check for existing user
        User.findOne({ 'local.email' :  email }, function(err, user) {
          // error check
            if (err)
                return done(err);

            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.'));

            // error message if password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

            // otherwise return successful
            return done(null, user);
        });

    }));

  };
