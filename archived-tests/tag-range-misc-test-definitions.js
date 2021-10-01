'use strict';

const tracker = require('./tracker');

let trackedCount = 0;
let untrackedCount = 0;

// kind of a tightly coupled hack with hardcoded max
const strings = require('./string-array.json');
let ix = 0;

/* eslint-disable no-unused-vars */

// track & get simulate API with pre-existing code
function trackAndGet() {
  const str = tracker.track(strings[ix++]);
  const props = tracker.getData(str);
  if (props.tracked) {
    trackedCount += 1;
  } else {
    untrackedCount += 1;
  }
}

function trackAndGet2() {
  const result = tracker.track2(strings[ix++]);
  if (result) {
    trackedCount += 1;
  } else {
    untrackedCount += 1;
  }
}

function process(data) {
  if (data && data.props.tracked) {
    trackedCount += 1;
  } else {
    untrackedCount += 1;
  }
}


// tagRange construction
class Properties {
  constructor() {
    this.event = null;
    this.tagRanges = [];
    this.tracked = true;
  }
  static make() {
    return {
      event: null,
      tagRanges: [],
      tracked: true
    };
  }

  static populate(o = {}) {
    o.event = null;
    o.tagRanges = [];
    o.tracked = true;
  }

  static populateAndReturn(o = {}) {
    o.event = null;
    o.tagRanges = [];
    o.tracked = true;
    return o;
  }
}

function object() {
  return {};
}

function construct() {
  return new Properties();
}

function make() {
  return Properties.make();
}

function assign() {
  const source = {event: null, tagRanges: [], tracked: true};
  Object.assign({}, source);
}

function populate() {
  Properties.populate();
}

function populateAndReturn() {
  return Properties.populateAndReturn();
}

function constructAndAssign(o = {}) {
  Object.assign(o, new Properties());
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
      groupWaitMS: 250,
    };
  },
  tests: {
    n1: () => 1,
    n1000: () => 1000,
    n10000: () => 10000,
    n1000000: () => 1000000,

    doMake: (n) => {return {n, fn: make}},
    doAssign: (n) => {return {n, fn: assign}},
    doConstruct: (n) => {return {n, fn: construct}},
    doPopulate: (n) => {return {n, fn: populate}},
    doPopulateAndReturn: (n) => {return {n, fn: populateAndReturn}},
    doConstructAndAssign: (n) => {return {n, fn: constructAndAssign}},

    execute: ({n, fn}) => {
      while (n-- > 0) {
        fn();
      }
    },

    trackAndGet,
    trackAndGet2,
    process,

    object,
    construct,
    make,
    assign,
    populate,
    populateAndReturn,

  },
  setup(config) {
  },
  groupSetup(config) {
    ix = 0;
  },
  final() {
    // eslint-disable-next-line no-console
    console.log('tracked', trackedCount, 'untracked', untrackedCount);
  }

};
