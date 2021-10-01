'use strict';

const fs = require('fs');

const napi = require('./processors/package-template.linux-x64-gnu.node');
const wasm = require('./processors/pkg');
const js = { Scanner: require('./processors/scanner.js') };
const jsmap = { Scanner: require('./processors/scanner-map.js')};

const stopChars = ";$'</\\&#%>=";
const napiStopChars = Buffer.from(stopChars);
const wasmStopChars = new Uint8Array(napiStopChars);

let trues = 0;
let falses = 0;
let bytes = 0;

function small() {
  return './data/small-file.txt';
}
function large() {
  return './data/large-file.txt';
}

function giant() {
  return './data/giant-file.txt';
}

function open(file = './data/large-file.txt') {
  return fs.createReadStream(file);
}

async function processNapi(stream) {
  const scanner = new napi.Scanner(napiStopChars);

  for await (const buffer of stream) {
    bytes += buffer.length;
    if (scanner.suspicious(buffer)) {
      trues += 1;
    } else {
      falses += 1;
    }
  }
}
async function processWasm(stream) {
  const scanner = new wasm.Scanner(wasmStopChars);

  for await (const buffer of stream) {
    bytes += buffer.length;
    if (scanner.suspicious(new Uint8Array(buffer))) {
      trues += 1;
    } else {
      falses += 1;
    }
  }
}

async function processJs(stream) {
  const scanner = new js.Scanner(stopChars);

  for await (const buffer of stream) {
    bytes += buffer.length;
    if (scanner.suspicious(new Uint8Array(buffer))) {
      trues += 1;
    } else {
      falses += 1;
    }
  }
}

async function processJsMap(stream) {
  const scanner = new jsmap.Scanner(stopChars);

  for await (const buffer of stream) {
    bytes += buffer.length;
    if (scanner.suspicious(new Uint8Array(buffer))) {
      trues += 1;
    } else {
      falses += 1;
    }
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
    n1000: () => 1000,
    n10000: () => 10000,
    n1000000: () => 1000000,

    small,
    large,
    giant,
    open,
    processNapi,
    processWasm,
    processJs,
    processJsMap,

  },
  setup(config) {
  },
  groupSetup(config) {
  },
  final() {
    // eslint-disable-next-line no-console
    console.log('trues', trues, 'falses', falses, 'bytes', bytes);
  }
};
