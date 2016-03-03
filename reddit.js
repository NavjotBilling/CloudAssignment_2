var cheerio = require('cheerio');
var fs = require('fs');
var request = require('request');
var express= require('express');
var db=require('./backend/db');
var Promise= require('bluebird');
var app= express();
var passport = require('passport');
var flash = require ('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var port     =  8080;
var mongoose = require('mongoose');
var configDB = require('./backend/db.js');
var urls = [];
var methodOverride = require('method-override');

mongoose.connect('mongodb://navjot:abcxyz123@ds060478.mlab.com:60478/cloudapp');
// configure the passport

// setting up the application
app.use(morgan('dev'));
app.use(cookieParser());

// for parsing
app.use(bodyParser());

app.set('view engine', 'ejs');
// setting up the views
require('./backend/passport')(passport);
app.use(session({ secret: 'olaamigo' })); // session secret
app.use(passport.initialize());
app.use(passport.session());

// flash for storing the messages
app.use(flash());
// routes
require('./app/routes.js')(app, passport);

exports.givemereddit = function() {
  return new Promise(function (resolve, reject) {
    request('https://www.reddit.com/', function(err, resp, body){
      if(!err && resp.statusCode == 200){
        var $= cheerio.load(body);
        $('a.title', '#siteTable').each(function(){
          var url = $(this).attr('href');
          if(url.indexOf('i.imgur.com')!= -1){
                urls.push(url);
          }

        });
        var array = [];
        $('div#siteTable > div.link').each(function( index ) {
          // scraping title
          var title = $(this).find('p.title > a.title').text().trim();
          // scraping score/upvotes
          var score = $(this).find('div.score.unvoted').text().trim();
          // scraping username
          var user = $(this).find('a.author').text().trim();
          // writes the text file in the local drive in root folder
          fs.appendFileSync('reddit.txt', title + '\n' + score + '\n' + user + '\n');
          var redditdoc = {}

          // calls title, upvotes and user
          redditdoc.title = title;
          redditdoc.score = score;
          redditdoc.user = user;
          array.push(redditdoc)
          db.insert_doc(redditdoc, 'redditdoc')

             .then(function(something){
             })
             .catch(function(error){
               console.log(error)
             })
   });
   resolve(array);
      }
    })
  })
}
// sets up the path of the file
app.get('/', function(req, res){

   });

// sets up the port to launch
  app.listen(port);
  console.log('The magic happens on port ' + port);
