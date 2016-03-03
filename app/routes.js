var myreddit = require('../reddit');

module.exports = function(app, passport) {


    /* Homepage */

    app.get('/', function(req, res) {
    res.render('index.ejs');

    });


    /* Show the login form */
    app.get('/login', function(req, res) {


        res.render('login.ejs', { message: req.flash('loginMessage') });
    });



    /* Show the sign up form*/

    app.get('/signup', function(req, res) {


        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });




    /* Profile*/

    app.get('/profile', isLoggedIn, function(req, res) {
      myreddit.givemereddit()
        .then(function(result) {
          console.log('result: ' ,result)
          res.render('profile.ejs', {user : req.user, redditresult: result});

        })
        .catch(function(error) {
          console.log(error);
        })
    });

    /*  Logout */

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    /* Signup */

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile',
        failureRedirect : '/signup',
        failureFlash : true
    }));

    /* Login */

    app.post('/login', passport.authenticate('local-login', {
       successRedirect : '/profile',
       failureRedirect : '/login',
       failureFlash : true
     }));

};



// if user is logged in process otherwise redirect them back to homepage
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
  }
