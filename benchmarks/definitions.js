'use strict';

const fs = require('fs');
const path = require('path');

//
// any setup done at the module level has minimal impact on the benchmarks.
//
const bigFileAsBuffer = fs.readFileSync(path.join(__dirname, '../data/bigfile.log'));
const tinyFileAsBuffer = fs.readFileSync(path.join(__dirname, '../data/tinyfile.log'));

module.exports = {
  configure() {
    // this can override the defaults (shown below) in index.js. they are
    // all pretty much what they sound like; see the code for more details.
    return {
      warmupIterations: 100,    // function chain executions to startup.
      groupIterations: 100000,  // function chain executions per group
      groupCount: 10,           // groups to execute
      groupWaitMS: 250,         // ms to wait between groups
      stddevRange: 2,           // beyond this many stddevs, group times are outliers
    };
  },

  // this example is a bit contrived, but it illustrates a benchmark definition.
  // the example goal is to compare different ways of splitting a log file into
  // lines.

  // these tests are split into two categories: data sources and consumers.
  // the sources supply data as either a string or a buffer. the consumers
  // are specific to each data type, and are responsible for splitting the
  // input into lines.
  tests: {
    // these are data sources
    bigText: () => bigFileAsBuffer.toString(),
    bigBuffer: () => bigFileAsBuffer,
    tinyText: () => tinyFileAsBuffer.toString(),
    tinyBuffer: () => tinyFileAsBuffer,
    // these are consumers
    split(s) {
      const lines = s.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const _line = lines[i];
      }
    },
    regex(f) {
      const re = /([^\n]*?)\n/g;
      let m;
      while ((m = re.exec(f))) {
        const _line = m[1];
      }
    },
    lastIxString(f) {
      let ix;
      let lastIx = 0;
      while ((ix = f.indexOf('\n', lastIx)) >= 0) {
        const _line = f.substring(lastIx, ix);
        lastIx = ix + 1;
      }
    },
    lastIxBuffer(b) {
      let ix;
      let lastIx = 0;
      while ((ix = b.indexOf(10, lastIx)) >= 0) {
        const _line = b.toString('utf8', lastIx, ix);
        lastIx = ix + 1;
      }
    }
  },
  // this is called before executing any tests. if the test needs to do any
  // setup based on the execution params it may do so here.
  setup(_config) {

  },
  // this is called before each group (including the warmup) is executed.
  // if a test requires setup for each group (e.g., initializing or clearing
  // an array) it can be done here. N.B. this is more likely to impact the
  // benchmark results than setup() because it's called multiple times within
  // the benchmark loop.
  groupSetup(_config) {

  },
  // this is called at the end of the benchmark. it can be used to clean up,
  // verify that actions were performed, etc.
  final(_config) {

  },
};
