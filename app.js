// Copyright 2015-2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

var express = require('express');
var SETTINGS = require('./settings.json');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var app = express();

app.get('/', function (req, res) {

  // spreadsheet key is the long id in the sheets URL
  var doc = new GoogleSpreadsheet(SETTINGS.SHEET);
  var sheet;

  async.series([
    function setAuth(step) {
      // see notes below for authentication instructions!
      var creds = require('./google-generated-creds.json');

      // OR, if you cannot save the file locally (like on heroku)
      var creds_json = {
        client_email: creds.client_email,
        private_key: creds.private_key
      }

      doc.useServiceAccountAuth(creds, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        if (err) {
          res.status(200).send(err);
        }

        console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
        console.log('Sheet 1: '+ sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);

        sheet = info.worksheets[0];
        step();
      });
    },
    function workingWithCells(step) {
      sheet.getCells({
        'min-row': 3,
        'max-row': 101,
        'min-col': 3,
        'max-col': 3,
        'return-empty': true
      }, function(err, cells) {
        var list = "";

        cells.forEach(function(cell, i) {
          list += cell.value + ', ';
        });

        res.status(200).send(list);

        step();
      });
    }
  ]);
});

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
