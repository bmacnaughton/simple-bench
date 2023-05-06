'use strict';

const d = require('../../node_modules/@contrast/distringuish');

const MAX_STRINGS = 1000;
const stringLengths = [2, 4, 8, 16, 32, 64];
const strings = {};
const untracked = Array(MAX_STRINGS);

// make sure we have enough characters to generate all the strings without
// duplicates. if we have enough for strings of length 2, there are enough
// for all lengths.
const charSet = 'abcdefghijklmnopqrstuvwxyzABCDEF'.split('');
if (charSet.length < Math.ceil(MAX_STRINGS ** 0.5)) {
  throw new Error(`must be at least ${Math.ceil(MAX_STRINGS ** 0.5)} characters`);
}

// generate all the strings
for (let i = 0; i < stringLengths.length; i++) {
  // generate MAX_STRINGS unique string for each length
  strings[stringLengths[i]] = Array(MAX_STRINGS);

  const applyArray = [];

  // how many elements do we need for each length of string?
  const needed = Math.ceil(Math.pow(MAX_STRINGS, 1 / stringLengths[i]));
  const chars = charSet.slice(0, needed);
  for (let j = 0; j < stringLengths[i]; j++) {
    applyArray.push(chars);
  }

  // count the strings so the generator can be terminated early
  let stringCount = 0;
  for (const chars of combinations(...applyArray)) {
    strings[stringLengths[i]][stringCount] = d.externalize(chars.join(''));
    stringCount += 1;
    if (stringCount >= MAX_STRINGS) {
      break;
    }
  }
}

function* combinations(head, ...tail) {
  const remainder = tail.length ? combinations(...tail) : [[]];
  for (const r of remainder) {
    for (const h of head) {
      yield [h, ...r];
    }
  }
}

let stringLength = 2;
module.exports = {
  configure() {
    return {
      // warmupIterations: 100,
      warmupIterations: 1000,
      // groupCount: 10,
      groupCount: 50,
      // groupIterations: 100000,
      groupIterations: 100000,
      // groupWaitMS: 1000,
      groupWaitMS: 250,
    };
  },
  setup(_config) { },
  groupSetup(_config) { },
  tests: {
    '1000'() {
      return 1000;
    },
    '100'() {
      return 100;
    },
    '10'() {
      return 10;
    },
    // kind of janky, but good approach for benchmark
    len2() {
      stringLength = 2;
    },
    len4() {
      stringLength = 4;
    },
    len8() {
      stringLength = 8;
    },
    len16() {
      stringLength = 16;
    },
    len32() {
      stringLength = 32;
    },
    len64() {
      stringLength = 64;
    },
    distringuish(n = 100) {
      for (let i = 0; i < n; i++) {
        untracked[i] = d.internalize(strings[stringLength][i]);
      }
    },
    slice(n = 100) {
      for (let i = 0; i < n; i++) {
        untracked[i] = String.prototype.slice.call(` ${strings[stringLength][i]}`, 1);
      }
    }

  },
  final(_config) {
    // verify that the strings are tracked at the end of the benchmark
    let untrackedCount = 0;
    for (const len of stringLengths) {
      for (let i = 0; i < MAX_STRINGS; i++) {
        const str = strings[len][i];
        if (!d.isExternal(str)) {
          untrackedCount += 1;
        }
      }
    }
    // verify that the sliced/internalized strings are not tracked
    let trackedCount = 0;
    for (let i = 0; i < MAX_STRINGS; i++) {
      const str = untracked[i];
      if (!str) {
        break;
      }
      if (d.isExternal(str)) {
        trackedCount += 1;
      }
    }
    /* eslint-disable no-console */
    if (untrackedCount) {
      console.log('untracked', untrackedCount);
    }
    if (trackedCount) {
      console.log('tracked', trackedCount);
    }
  }
};
