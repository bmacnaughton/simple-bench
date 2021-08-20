'use strict';

const oldTracker = require('./old-tracker');
const newTracker = require('./new-tracker');

let trackedCount = 0;
let untrackedCount = 0;

/* eslint-disable no-unused-vars */

function n1000000() {
  return 1000000;
}

// track & get
function oldTG() {
  const tracked = oldTracker.track('a string');
  return oldTracker.getData(tracked);
}
function oldTGrS() {
  const tracked = oldTracker.track('a string');
  // to stay parallel
  oldTracker.getData(tracked);
  return tracked;
}
function oldTrS() {
  return oldTracker.track('a string');
}

function newTG() {
  const {str, props} = newTracker.track('a string');
  return props;
}
function newTGrS() {
  const {str, props} = newTracker.track('a string');
  return str;
}
function newTrS() {
  const {str} = newTracker.track('a string');
  return str;
}

function oldCheckTracked(s) {
  if (oldTracker.getData(s).tracked) {
    trackedCount += 1;
  } else {
    untrackedCount += 1;
  }
  return s;
}

function newCheckTracked(s) {
  const props = newTracker.getData(s);
  if (props) {
    trackedCount += 1;
  } else {
    untrackedCount += 1;
  }
  return s;
}

function oldG(s = 'a string') {
  const d = oldTracker.getData(s);
  if (d.tracked) {
    return d;
  }
  return null;
}

function newG(s = 'a string') {
  const d = newTracker.getData(s);
  if (d) {
    return d;
  }
  return null;
}


module.exports = {
  configure() {
    return {
      // warmupIterations: 100,
      warmupIterations: 1000,
      // groupCount: 10,
      groupCount: 10,
      // groupIterations: 100000,
      groupIterations: 1000000,
      // groupWaitMS: 1000,
      groupWaitMS: 500,
    };
  },
  tests: {
    n1000000,

    oldTG,
    oldTGrS,
    oldTrS,
    oldCheckTracked,

    newTG,
    newTGrS,
    newTrS,
    newCheckTracked,
  },
  setup(config) {
  },
  final() {
    // eslint-disable-next-line no-console
    console.log('tracked', trackedCount, 'untracked', untrackedCount);
  }

};
