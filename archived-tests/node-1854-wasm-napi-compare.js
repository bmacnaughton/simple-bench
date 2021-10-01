'use strict';

const fs = require('fs');
const _stream = require('stream');

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

const filenames = {
  small: './data/small-file.txt',
  large: './data/large-file.txt',
  giant: './data/giant-file.txt',
};
const buffers = {
  small: [],
  large: [],
  giant: [],
};

function small() {
  return 'small';
}
function large() {
  return 'large';
}

function giant() {
  return 'giant';
}

// to verify buffer counts insert this into the chain after the
// size function (small, large, giant).
const bufferCounts = [];
let prevCount = -1;
function capture(name) {
  const bufs = buffers[name];
  if (bufferCounts.length < 10) {
    if (bufs.length !== prevCount) {
      bufferCounts.push(bufs.length);
      prevCount = bufs.length;
    }
  }
  return name;
}

function open(file = 'large') {
  return fs.createReadStream(filenames[file]);
}

function stream(file = 'large') {
  return _stream.Readable.from(buffers[file]);
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
    stream,
    processNapi,
    processWasm,
    processJs,
    processJsMap,
    // debug/verify
    capture,

  },
  async setup(config) {

    for (const name of ['small', 'large', 'giant']) {
      const s = fs.createReadStream(filenames[name]);
      for await (const buf of s) {
        buffers[name].push(buf);
      }
    }
  },
  async groupSetup(config) {
  },
  final(config) {
    /* eslint-disable no-console */
    console.log('trues', trues, 'falses', falses, 'bytes', bytes);
    if (config.functionChain.indexOf('capture') >= 0) {
      console.log('buffer counts', bufferCounts);
    }
  }
};
