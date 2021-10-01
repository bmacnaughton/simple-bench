'use strict';

const _ = require('lodash');
//const tracker = require('./tracker');
const tracker = {};
const fjStringify = require('fast-json-stringify');
const tenK = require('./data/10000.txt');

const FAST = {stringify: fjStringify({})};

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

function JStringify() {
  JSON.stringify(tenK);
}

function FJStringify() {
  FAST.stringify(tenK);
}

const fetchObject = {
  property_1: {
    a: {
      b: {
        c: {
          d: "Hello"
        }
      }
    }
  }
}

function directFetch(n = 1) {
  for (let i = 0; i < n; i++) {
    fetchObject.property_1.a.b.c.d;
  }
}

const preSplit = 'property_1.a.b.c.d'.split('.');
function lodashSplitFetch(n = 1) {
  for (let i = 0; i < n; i++) {
    _.get(fetchObject, preSplit);
  }
}

function lodashFetch(n = 1) {
  for (let i = 0; i < n; i++) {
    _.get(fetchObject, 'property_1.a.b.c.d');
  }
}

const itemsDef = ['', 'a', 1, 44, 'x', {}];
const itemsDefX = {
  key1: 0,
  key2: 0,
  key4: 0,
  key8: 1,
  key16: 1,
  key32: 1
};

function forLoop(items = itemsDef) {
  let event = false;
  for (const item of items) {
    if (event) {
      event = !event;
    } else {
      event = !event;
    }
    if (item) {
      item;
    }
  }
}

function forEach(items = itemsDef) {
  let event = false;
  items.forEach(item => {
    if (event) {
      event = !event;
    } else {
      event = !event;
    }
    if (item) {
      items;
    }
  });
}

const array = new Array(5).fill({key: 'value'});

function JKsequential(items = array) {
  const len = items.length;
  for (let i = 0; i < len; i++) {
    items[i].key = 'One';
  }
}
function JKforOf(items = array) {
  for (const val of items) {
    items.key = 'Two';
  }
}
function JKforEach(items = array) {
  items.forEach((val) => {
    val.key = 'Three';
  });
}

const TARGET = Symbol('target');
const obj = {bruce: 'says', hi: 'there'};
const p = new Proxy(obj, {
  get(tar, prop, recv) {
    if (prop === TARGET) {
      return tar;
    }
    return Reflect.get(tar, prop, recv);
  }
});

// fail and pass
const wmf = new WeakMap();
const wmp = new WeakMap();
wmp.set(p, obj);

function braned() {
  return p;
}
function unbraned() {
  return obj;
}

function weakMapFetch(obj) {
  return wmp.get(obj) || obj;
}

function symbolFetch() {
  return obj[TARGET] || obj;
}

function f() {

}

function call() {
  return f.call(this, 1, 2, 3);
}
function apply() {
  return f.apply(this, [1, 2, 3]);
}

//
// checking typeof object
//

const exotics = [
  // all can be handled by iterable check.
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
];

function exoticsArrayFor(item = {}) {
  for (const type of exotics) {
    if (item instanceof type) {
      return true;
    }
  }
  return false;
}

function exoticsArraySome(item = {}) {
  return exotics.some(type => item instanceof type);
}

function exoticsIter(item = {}) {
  if (item[Symbol.iterator] && !Array.isArray(item)) {
    return true;
  }
  return false;
}

const m = new Map();
m.set(exotics, {hello: 'goodbye'});

function has() {
  if (m.has(exotics)) {
    return m.get(exotics);
  }
}
function get() {
  const z = m.get(exotics);
  if (z) {
    return z;
  }
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
    n100: () => 100,
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

    JStringify,
    FJStringify,

    directFetch,
    lodashFetch,
    lodashSplitFetch,

    forLoop,
    forEach,

    JKsequential,
    JKforOf,
    JKforEach,

    braned,
    unbraned,
    weakMapFetch,
    symbolFetch,

    call,
    apply,

    exoticsArrayFor,
    exoticsArraySome,
    exoticsIter,

    has,
    get,
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
