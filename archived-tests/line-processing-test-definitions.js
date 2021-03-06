'use strict';

const fs = require('fs');

/* eslint-disable no-unused-vars */

/*
  - file.split('\n')
  - while (m = /([^\n]*?)\n/g.exec(file)) {...}
  - lastIx = 0; while ((ix = file.indexOf('\n', last + 1)) >= 0) {substr...; lastIx = ix}
  - previous but use buffer
 */

const ginormousfile = 'data/ginormous.log';
const giantfile = 'data/giantfile.log';
const bigfile = 'data/bigfile.log';
const tinyfile = 'data/tinyfile.log';

const _giantfile = fs.readFileSync(giantfile, 'utf8');
const _bigfile = fs.readFileSync(bigfile, 'utf8');
const _tinyfile = fs.readFileSync(tinyfile, 'utf8');

const b_giantfile = fs.readFileSync(giantfile);
const b_bigfile = fs.readFileSync(bigfile);
const b_tinyfile = fs.readFileSync(tinyfile);


// filename
function ginormous() {
  return {file: ginormousfile, lines: 1000000};
}
function giantFilename() {
  return {file: giantfile, lines: 154880};
}
function bigFilename() {
  return {file: bigfile, lines: 3872};
}
function tinyFilename() {
  return {file: tinyfile, lines: 4};
}

// augment the filename
function addParse(config) {
  config.parse = true;
}

// text
function giantFileAsText() {
  return _giantfile;
}
function bigFileAsText() {
  return _bigfile;
}
function tinyFileAsText() {
  return _tinyfile;
}

// buffer
function giantFileAsBuffer() {
  return b_giantfile;
}
function bigFileAsBuffer() {
  return b_bigfile;
}
function tinyFileAsBuffer() {
  return b_tinyfile();
}

function split(f) {
  const lines = f.split('\n');
}

function regex(f) {
  const re = /([^\n]*?)\n/g;
  let m;
  while ((m = re.exec(f))) {
    const line = m[1];
  }
}

function lastIxString(f) {
  let ix;
  let lastIx = 0;
  while ((ix = f.indexOf('\n', lastIx)) >= 0) {
    const line = f.substring(lastIx, ix);
    lastIx = ix + 1;
  }
}

function lastIxBuffer(b) {
  let ix;
  let lastIx = 0;
  while ((ix = b.indexOf(10, lastIx)) >= 0) {
    const line = b.toString('utf8', lastIx, ix);
    lastIx = ix + 1;
  }
}

async function streamProcessFile({file, lines, parse}) {
  const s = fs.createReadStream(file, {encoding: 'utf8'});

  const done = {};
  const p = new Promise((resolve, reject) => {
    done.resolve = resolve;
    done.reject = reject;
  });

  let lineCount = 0;
  s.on('end', function() {
    if (lineCount !== lines) {
      done.reject(`lineCount ${lineCount}`);
    } else {
      done.resolve();
    }
  });

  s.on('error', function(e) {
    done.reject(e);
  });

  let leftover = '';
  s.on('data', function(chunk) {
    leftover = processLines(leftover, chunk);
  });

  function processLines(prevChars, newChars) {
    let ix = newChars.indexOf('\n');
    if (ix < 0) {
      return prevChars + newChars;
    }
    // there is a newline in newChars. it's possible to
    // just concatenate prevChars to newChars but there
    // is a cost for making the chunk longer.

    let line = prevChars + newChars.substring(0, ix);
    lineCount += 1;
    let lastIx = ix + 1;
    if (parse) {
      processLine(line);
    }
    //let lastIx = 0;
    //newChars = prevChars + newChars;

    while ((ix = newChars.indexOf('\n', lastIx)) >= 0) {
      line = newChars.substring(lastIx, ix);
      lineCount += 1;
      lastIx = ix + 1;
      if (parse) {
        processLine(line);
      }
    }

    // return any leftover part
    return newChars.substring(lastIx);
  }

  return p;
}

async function readProcessFile({file, lines: lineCount, parse}) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  if (lines.length !== lineCount + 1) {
    throw new Error(`lines.length ${lines.length}`);
  }
  if (!lines[lines.length - 1]) {
    lines.length = lines.length - 1;
  }
  for (const line of lines) {
    if (parse) {
      processLine(line);
    }
  }
}

function processLine(line) {
  return JSON.parse(line);
}

async function justWait() {
  return new Promise(resolve => setTimeout(resolve, 10));
}

const array = [];
function items() {
  return array;
}

function pushItems(a) {
  return [].push(...a);
}

function concatItems(a) {
  return [].concat(a);
}


module.exports = {
  configure() {
    return {
      groupIterations: 100000,
      groupWaitMS: 1000,
    };
  },
  tests: {
    // data sources
    ginormous,
    giantFilename,
    bigFilename,
    tinyFilename,
    giantFileAsText,
    giantFileAsBuffer,
    bigFileAsText,
    bigFileAsBuffer,
    tinyFileAsText,
    tinyFileAsBuffer,
    // line splitters
    streamProcessFile,
    readProcessFile,
    split,
    regex,
    lastIxString,
    lastIxBuffer,
    // consistency check
    justWait,
    // quick test
    items,
    pushItems,
    concatItems,
  },
  setup(config) {
    for (let i = 0; i < 10; i++) {
      array[i] = i;
    }
  },

};

if (!module.parent) {
  /* eslint-disable no-console */
  const f = fs.readFileSync('route-metrics.json', 'utf8');
  const b = fs.readFileSync('route-metrics.json');
  console.log('string');
  lastIxString(f);
  console.log('buffer');
  lastIxBuffer(b);
  console.log('regex');
  regex(f);
}
