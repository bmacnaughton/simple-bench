'use strict';
/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

// this file executes tests it imports from
// test-definitions.

const perf_hooks = require('perf_hooks');
const { performance: perf, PerformanceObserver: PerfObserver } = perf_hooks;
const util = require('util');

const tests = require('./test-definitions');

//// this has the extension 'js-x' so the tests won't try to run it
//const TagRange = require('../agent/lib/assess/models/tag-range');
//// load tag range utilities v1 (existing) and v2 (proposed).
//const truV1 = require('../agent/lib/assess/models/tag-range/util-x.js');
//const truV2 = require('../agent/lib/assess/models/tag-range/util.js');
//
//const str = 'space laser gun';
//const pewpew = 'pew pew';
//const zoink = 'zoink';
//
//const pewpew0toLength = new TagRange(0, str.length, pewpew);
//const pewpew0to1 = new TagRange(0, 1, pewpew);
//const pewpew3to4 = new TagRange(3, 4, pewpew);
//const pewpew6to7 = new TagRange(6, 7, pewpew);
//const pewpew0to5 = new TagRange(0, 5, pewpew);
//const pewpew5to10 = new TagRange(5, 10, pewpew);
//const pewpew6to10 = new TagRange(6, 10, pewpew);
//const zoink0toLength = new TagRange(0, str.length - 1, zoink);
//const zoink6to10 = new TagRange(6, 10, zoink);

const warmup = 100;

const interationsPerGroup = 100000;
const groupCount = 10;
const groupWaitMS = 1000;

const groupTimes = [];
let gcCounts = 0;
let totalGCTime = 0;

let functionChain;

// take from env?
// add .remove() vs .removeInPlace() test
// add .filterMatching() comparison - the impact of lodash, nothing more
// ditto .filterNonSupersetGroups() and .tagRangesEncompass()
const arg = process.argv[2];
if (arg in tests) {
  functionChain = [tests[arg]];
} else {
  console.log('util.bench: invalid execute parameter:', arg);
  // eslint-disable-next-line
  process.exit(1);
}

const gcTypes = {
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR]: 'major',      // 2
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR]: 'minor',      // 1
  [perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incr', // 4
  [perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB]: 'weak',      // 8
};

//
// setup measurements
//

const verbose = process.env.VERBOSE;

const obs = new PerfObserver((list) => {
  const entries = list.getEntries();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.entryType === 'measure') {
      verbose && console.log(`perf ${entry.name}: ${entry.duration}`);
      groupTimes.push(entry.duration);
    } else if (entry.entryType === 'gc') {
      const kind = gcTypes[entry.kind] || entry.kind;
      verbose && console.log(`perf gc: ${entry.duration} (${kind}) flags: ${entry.flags}`);
      gcCounts += 1;
      totalGCTime += entry.duration;
    }
  }
});
obs.observe({entryTypes: ['measure', 'gc'], buffered: true});

async function test() {
  for (let i = warmup; i > 0; i--) {
    execute(functionChain);
  }
  await pause(groupWaitMS);

  for (let i = groupCount; i > 0; i--) {
    perf.mark('start-iteration');
    for (let i = interationsPerGroup; i > 0; i--) {
      execute(functionChain);
    }
    perf.measure('iteration-time', 'start-iteration');
    await pause(groupWaitMS);
  }

  await pause(groupWaitMS);
}

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test().then(() => {
  obs.disconnect();
  // throw out the first one
  const iTimes = groupTimes.slice(1);
  const nIntervals = iTimes.length;
  const total = iTimes.reduce((tot, v) => tot + v, 0);
  console.log(`group times: [${iTimes.map((t) => t.toFixed(2)).join(', ')}]`);
  console.log(`average per ${interationsPerGroup}: ${(total/nIntervals).toFixed(3)}`);
  console.log(`stddev of ${nIntervals} groups: ${stddev(iTimes).toFixed(3)}`)
  console.log(`total: gc count: ${gcCounts}, gc time: ${totalGCTime.toFixed(3)}`);

  console.log('done');
});

//
// execute functionChains
//
function execute(fc) {
  let lastResult = [];
  for (let i = 0; i < fc.length; i++) {
    lastResult = fc[i](lastResult);
  }
}


//
// summarization functions
//
function mean(array) {
  return array.reduce((tot, v) => tot + v, 0) / array.length;
}

function variance(array) {
  const average = mean(array);
  return mean(array.map((num) => (num - average) ** 2));
}

function stddev(array) {
  return variance(array) ** 0.5;
}
