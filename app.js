/*

  MR AND MRS HWANG ARE HAVING A PARTY

*/


// [START app]
'use strict';

var express = require('express')
  , engine = require('ejs-locals')
  , SETTINGS = require('./settings.json')
  , creds = require('./google-generated-creds.json')
  , GoogleSpreadsheet = require('google-spreadsheet')
  , async = require('async');

var app = express();

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Index path just shows everyone
app.get('/', function (req, res) {

  // Thank you Javascript for this beautiful structure...
  async.waterfall([
    async.apply(getGoogleSheet),
    async.apply(getPeople),
    async.apply(showPeopleTable),
    function (msg, callback) {
      // Output list of people
      // res.status(200).send(msg);

      res.render('index', {
        people_table: msg
      });
    }
  ]);
});

// Simple path to add someone to the spreadsheet
app.get('/add/:person/:number', function (req, res) {

  async.waterfall([
    async.apply(getGoogleSheet),

    // Here's the good stuff
    function (sheet, callback) {

      // Create the new person
      var person = {
        name: req.params.person,
        address: 'California',
        email: 'blah@gmail.com',
        number: req.params.number || 1
      };

      // Add them to the spreadsheet
      sheet.addRow(person, function() {

        // Onwards!
        callback(null, sheet);
      });
    },

    async.apply(getPeople),
    async.apply(showPeopleTable),
    function (msg, callback) {
      // Output list of people
      res.status(200).send(msg);
    }
  ]);
});

// Helper function that callbacks with the worksheet we want
var getGoogleSheet = function(callback) {
  // spreadsheet key is the long id in the sheets URL
  var doc = new GoogleSpreadsheet(SETTINGS.DOC_ID);

  // Authorize
  doc.useServiceAccountAuth(creds, function (err) {

    // Get Google Spreadsheet info
    doc.getInfo(function (err, info) {
      if (err) {
        res.status(200).send(err);
      }

      console.log('Loaded: ' + info.title + ' by ' + info.author.email);

      // Return specific worksheet
      callback(null, info.worksheets[SETTINGS.SHEET]);
    });
  });
};

// Takes worksheet, callbacks with an array of people
var getPeople = function(sheet, callback) {
  var people = [];

  // Grab only 20 rows right now
  sheet.getRows({
    offset: 1,
    limit: 20,
    orderby: 'col1'
  }, function (err, rows) {

    // No additional formatting right now
    rows.forEach(function (row, i) {
      people[i] = row;
    });

    callback(null, people);
  });
};

// Takes array of people, builds janky html table
var showPeopleTable = function(people, callback) {
  console.log(people.length, 'people');

  var msg = "<table>";

  people.forEach(function (row, i) {
    msg += '<tr><td>' + people[i].name + '</td><td>' + people[i].address + '</td></tr>';
  });

  msg += "</table>";

  callback(null, msg);
};

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
