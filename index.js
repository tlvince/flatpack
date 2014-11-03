#!/usr/bin/env node
'use strict';

var config = require('config');
var inquirer = require('inquirer');
var request = require('request');
var Promise = require('bluebird');

request = request.defaults({
  json: true
});

request = Promise.promisify(request);

var couchdb;

function promptPromise(questions, answer) {
  return new Promise(function(resolve) {
    inquirer.prompt(questions, function(answers) {
      if (answer) {
        return resolve(answers[answer]);
      }
      return resolve(answers);
    });
  });
}

function getCouchURL() {
  if (config.has('couchdb')) {
    return Promise.resolve(config.get('couchdb'));
  }

  var question = {
    type: 'input',
    name: 'couchdb',
    message: 'What is the CouchDB instance URL?',
    validate: function(url) {
      if (url) {
        return true;
      }
      return 'Please enter a valid URL';
    }
  };

  return promptPromise(question, 'couchdb');
}

function errorHandler(error) {
  if (error.body) {
    error = error.body;
  }
  console.error(error);
  process.exit(1);
}

function getUsers(url) {
  var options = {
    url: url + '/_users/_all_docs',
    qs: {
      startkey: '"org.couchdb.user:"',
      endkey: '"org.couchdb.userz"',
      /*eslint-disable camelcase */
      include_docs: true
      /*eslint-enable camelcase */
    }
  };
  return request(options);
}

function responseHandler(response, body) {
  if (response.statusCode !== 200) {
    return Promise.reject(response);
  }
  return body;
}

function pluckDocs(response) {
  function pluck(row) {
    return row.doc;
  }
  return response.rows.map(pluck);
}

function log(result) {
  console.log(result);
}

function transposeUsers(users) {
  function transpose(user) {
    return {
      name: user.name,
      value: user.name
    };
  }
  return users.map(transpose);
}

function createPrompt(users) {
  var questions = [
    {
      type: 'input',
      name: 'name',
      message: 'What would you like this database to be called?',
      validate: function(name) {
        if (name) {
          return true;
        }
      },
      filter: function(name) {
        return name.toLowerCase().trim();
      }
    },
    {
      type: 'checkbox',
      name: 'users',
      message: 'Which user(s) should be responsible?',
      validate: function(users) {
        if (users.length) {
          return true;
        }
        return 'Please choose at least one user';
      },
      choices: users
    }
  ];
  return promptPromise(questions);
}

function setCouchURL(url) {
  couchdb = url;
  return url;
}

function createDB(database) {
  var url = couchdb + '/' + database.name;

  function create() {
    var options = {
      url: url,
      method: 'PUT'
    };
    return request(options);
  }

  function setSecurity() {
    var options = {
      url: url + '/_security',
      method: 'PUT',
      body: {
        admins: {
          names: database.users
        },
        members: {
          names: database.users
        }
      }
    };
    return request(options);
  }

  return create()
    .then(setSecurity);
}

function flatpack() {
  return getCouchURL()
    .then(setCouchURL)
    .then(getUsers)
    .spread(responseHandler)
    .then(pluckDocs)
    .then(transposeUsers)
    .then(createPrompt)
    .then(createDB)
    .spread(responseHandler)
    .then(log)
    .catch(errorHandler);
}

flatpack();
