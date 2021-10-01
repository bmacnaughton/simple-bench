'use strict';

const fs = require('fs');

const napi = require('./processors/package-template.linux-x64-gnu.node');
const wasm = require('./processors/pkg');

const stopChars = ";$'</\\&#%>=";
const napiStopChars = Buffer.from(stopChars);
const wasmStopChars = new Uint8Array(napiStopChars);

function small() {
  return './data/small-file.txt';
}
function large() {
  return './data/large-file.txt';
}

function open(file = './data/large-file.txt') {
  return fs.createReadStream(file);
}

async function processNapi(stream) {
  const scanner = new napi.Scanner(napiStopChars);

  for await (const buffer of stream) {
    scanner.suspicious(buffer);
  }
}
async function processWasm(stream) {
  const scanner = new wasm.Scanner(wasmStopChars);

  for await (const buffer of stream) {
    scanner.suspicious(new Uint8Array(buffer));
  }
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

    small,
    large,
    open,
    processNapi,
    processWasm,

    JStringify,
    FJStringify,

    directFetch,
    lodashFetch,
    lodashSplitFetch,
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
