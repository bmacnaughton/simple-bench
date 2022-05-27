'use strict';

const inquirer = require('inquirer');

const questions = [
  {
    name : 'parent',
    message: 'What is the major release line that you want to update?',
    type: 'list', choices: ['v4', 'v3']
  }, {
    name: 'type',
    message: 'What kind of release do you want to make?',
    type: 'list',
    choices: (hash) => {
      if (hash.parent === 'v4') {
        return ['prerelease', 'patch', 'minor'];
      } else {
        return ['patch', 'prerelease'];
      }
    }
  }, {
    name: 'ticket',
    type: 'input',
    message: 'What\'s the release ticket in Jira(e.g. NODE-1776)?',
    filter: (val) => val.toUpperCase(),
    validate: (data) => {
      const validTicket = data.match(/[a-zA-z]{2,7}-[\d]{1,7}/);
      if (validTicket) {
        return true;
      }

      return 'Please enter a valid Jira release ticket(e.g. NODE-123)';
    }
  }, {
    name: 'check',
    type: 'input',
    default: 'bruce-says-hi',
    when: (hash) => {
      hash.check = 'bruce-says-hi';
      return hash.parent === 'v4';
    }
  }
];

inquirer.prompt(questions)
  .then(r => console.log(r));

