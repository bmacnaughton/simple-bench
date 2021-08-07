'use strict';

const fs = require('fs');

/* eslint-disable no-unused-vars */

/*
  - file.split('\n')
  - while (m = /([^\n]*?)\n/g.exec(file)) {...}
  - lastIx = 0; while ((ix = file.indexOf('\n', last + 1)) >= 0) {substr...; lastIx = ix}
  - previous but use buffer
 */

const giantfile = 'data/giantfile.log';
const bigfile = 'data/bigfile.log';
const tinyfile = 'data/tinyfile.log';

const _giantfile = fs.readFileSync(giantfile, 'utf8');
const _bigfile = fs.readFileSync(bigfile, 'utf8');
const _tinyfile = fs.readFileSync(tinyfile, 'utf8');

const b_giantfile = fs.readFileSync(giantfile);
const b_bigfile = fs.readFileSync(bigfile);
const b_tinyfile = fs.readFileSync(tinyfile);

// create files of n lines

function giantFileAsText() {
  return _giantfile;
}

function bigFileAsText() {
  return _bigfile;
}

function tinyFileAsText() {
  return _tinyfile;
}

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


module.exports = {
  configure() {
    return {
      groupIterations: 100,
      groupWaitMS: 1000,
    };
  },
  tests: {
    // data sources
    giantFileAsText,
    giantFileAsBuffer,
    bigFileAsText,
    bigFileAsBuffer,
    tinyFileAsText,
    tinyFileAsBuffer,
    // line splitters
    split,
    regex,
    lastIxString,
    lastIxBuffer,
  },
  setup(config) {

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
