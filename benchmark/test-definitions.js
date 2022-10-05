'use strict';

const fs = require('fs');

const lib = require('@contrast/agent-lib');
const al = new lib.Agent();
const {Generator} = require('@bmacnaughton/string-generator');
const gen = new Generator().generate;

const issue38 = require('../issue-38.json');
const issue38json = fs.readFileSync('./issue-38.json');
const issue38buffer = Buffer.from(issue38json);


const strings = [];
for (let i = 0; i < 10; i++) {
  const string = gen('${[A-Za-z0-9 ]<10000>}');
  strings.push(string);
}

function small() {
  return './data/small-file.txt';
}
function large() {
  return './data/large-file.txt';
}

function open(file = './data/large-file.txt') {
  return fs.createReadStream(file);
}

function simpleTraverse(obj, cb) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  const path = [];
  /* eslint-disable complexity */
  function traverse(obj) {
    const isArray = Array.isArray(obj);
    for (const k in obj) {
      if (isArray) {
        // if it is an array, store each index in path but don't call the
        // callback on the index itself as they are just numeric strings.
        path.push(k);
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          traverse(obj[k]);
        } else if (typeof obj[k] === 'string' && obj[k]) {
          cb(path, 'Value', obj[k]);
        }
        path.pop();
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        cb(path, 'Key', k);
        path.push(k);
        traverse(obj[k]);
        path.pop();
      } else {
        cb(path, 'Key', k);
        // only callback if the value is a non-empty string
        if (typeof obj[k] === 'string' && obj[k]) {
          path.push(k);
          cb(path, 'Value', obj[k]);
          path.pop();
        }
      }
    }
  }

  traverse(obj);
}

function simpleTraverse38() {
  simpleTraverse(issue38, () => {});
}

function traverse(object, callback) {
  if (object === null || typeof object !== 'object')
    return;
  const recurse = (obj, prevPath = []) => {
    const isArray = Array.isArray(obj);
    Object.entries(obj).forEach(([key, val]) => {
      // don't call the callback on array indices.
      if (!isArray) {
        callback(prevPath, 'Key', key);
      }
      const path = [...prevPath, key];
      if (val !== null && typeof val === 'object') {
        recurse(val, path);
      }
      else if (typeof val === 'string' && val) {
        callback(path, 'Value', val);
      }
    });
  };
  recurse(object);
}

function traverse38() {
  traverse(issue38, () => {});
}

const preferWW = {preferWorthWatching: true};
function agentLibParse(last) {
  const rules = last.length ? last[0] : 1;
  al.scoreRequestUnknownBody(rules, issue38buffer, preferWW);
  // simulate framework parsing the string too
  //JSON.parse(issue38json);
}

function agentFrameworkParse(last) {
  const issue38 = JSON.parse(issue38json);
  const rules = last.length ? last[0] : 1;
  const {ParameterKey, ParameterValue} = lib.constants.InputType;
  simpleTraverse(issue38, function(path, type, value) {
    const inputType = type === 'Key' ? ParameterKey : ParameterValue;
    al.scoreAtom(rules, value, inputType, preferWW);
  });
}

function jsonParseOnly(last) {
  JSON.parse(issue38json);
}
const array = [2, 4, 6, 8, 10, 12, 14, 16];
function arrayLength() {
  return array[array.length - 1];
}
function arraySlice() {
  return array.slice(-1)[0];
}

module.exports = {
  configure() {
    return {
      // warmupIterations: 100,
      warmupIterations: 1000,
      // groupCount: 10,
      groupCount: 10,
      // groupIterations: 100000,
      groupIterations: 10000,
      // groupWaitMS: 1000,
      groupWaitMS: 250,
    };
  },
  tests: {
    n1: () => 1,
    n100: () => 100,
    n1000: () => 1000,
    n10000: () => 10000,
    n1000000: () => 1000000,

    arrayLength,
    arraySlice,

    rules1: () => al.RuleType['path-traversal'],
    rulesAll: () => 255,

    small,
    large,
    open,

    traverse38,
    simpleTraverse38,

    strConcat() {
      ''.concat.apply('', strings);
    },

    strJoin() {
      strings.join('');
    },

    agentLibParse,
    agentFrameworkParse,
    jsonParseOnly
  },
  setup(config) {
  },
  groupSetup(config) {
  },
  final() {
    // eslint-disable-next-line no-console
    //console.log('tracked', trackedCount, 'untracked', untrackedCount);
  }
};
