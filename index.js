'use strict';
/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

const perf_hooks = require('perf_hooks');
const { performance: perf, PerformanceObserver: PerfObserver } = perf_hooks;
const util = require('util');

const tests = require('./test-defs-2');

// take from env?
// add .remove() vs .removeInPlace() test
// add .filterMatching() comparison - the impact of lodash, nothing more
// ditto .filterNonSupersetGroups() and .tagRangesEncompass()
const argv = process.argv.slice(2);
const optionStrings = [];
while (argv.length && argv[0].startsWith('-')) {
  optionStrings.push(argv.shift());
}
const options = {};
const [version, ...args] = argv;

const checks = tests.validate({version, args, options});
if (!checks.ok) {
  console.error(checks);
  process.exit(1);
}

const execute = tests.make(checks);

console.log('executing', version, ...args);

const gcFlags = {
  [perf_hooks.constants.NODE_PERFORMANCE_GC_FLAGS_NO]: 'NO',
  [perf_hooks.constants.NODE_PERFORMANCE_GC_FLAGS_CONSTRUCT_RETAINED]: 'CONSTRUCT_RETAINED',
  [perf_hooks.constants.NODE_PERFORMANCE_GC_FLAGS_FORCED]: 'FORCED',
  [perf_hooks.constants.NODE_PERFORMANCE_GC_FLAGS_SYNCHRONOUS_PHANTOM_PROCESSING]: 'SYNCHRONOUS_PHANTOM_PROCESSING',
  [perf_hooks.constants.NODE_PERFORMANCE_GC_FLAGS_ALL_AVAILABLE_GARBAGE]: 'ALL_AVAILABLE_GARBAGE',
  [perf_hooks.constants.NODE_PERFORMANCE_GC_FLAGS_ALL_EXTERNAL_MEMORY]: 'ALL_EXTERNAL_MEMORY',
  [perf_hooks.constants.NODE_PERFORMANCE_GC_FLAGS_SCHEDULE_IDLE]: 'SCHEDULE_IDLE',
};

const gcFlagCounts = {
  NO: 0,
  CONSTRUCT_RETAINED: 0,
  FORCED: 0,
  SYNCHRONOUS_PHANTOM_PROCESSING: 0,
  ALL_AVAILABLE_GARBAGE: 0,
  ALL_EXTERNAL_MEMORY: 0,
  SCHEDULE_IDLE: 0,
  undefined: 0,
};

const gcTypes = {
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR]: 'minor',      // 1
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR]: 'major',      // 2
  [perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incr', // 4
  [perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB]: 'weak',      // 8
};

//
// setup measurements
//
const verbose = process.env.VERBOSE;
const groupTimes = [];
let gcCounts = 0;
let totalGCTime = 0;
let gcTypeCounts = {
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR]: 0,
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR]: 0,
  [perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL]: 0,
  [perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB]: 0,
};

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
      gcTypeCounts[entry.kind] += 1;
      gcFlagCounts[gcFlags[entry.flags]] += 1;
      totalGCTime += entry.duration;
    }
  }
});
obs.observe({entryTypes: ['measure', 'gc'], buffered: true});

//
// execute the tests
//
const warmup = 100;

const iterationsPerGroup = 100000;
const groupCount = 10;
const groupWaitMS = 500;

async function test() {
  for (let i = warmup; i > 0; i--) {
    execute();
  }
  await pause(groupWaitMS);

  for (let i = groupCount; i > 0; i--) {
    perf.mark('start-iteration');
    for (let i = iterationsPerGroup; i > 0; i--) {
      execute();
    }
    perf.measure('iteration-time', 'start-iteration');
    await pause(groupWaitMS);
  }

  await pause(groupWaitMS);
}

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//
// test then summarize
//
test().then(() => {
  obs.disconnect();
  // throw out the first one
  const iTimes = groupTimes.slice(1);
  const nGroups = iTimes.length;
  const total = iTimes.reduce((tot, v) => tot + v, 0);
  console.log(`group times: [${iTimes.map((t) => t.toFixed(2)).join(', ')}]`);
  console.log(`average per ${iterationsPerGroup}: ${(total/nGroups).toFixed(3)}`);
  console.log(`standard deviation of ${nGroups} groups: ${stddev(iTimes).toFixed(3)}`)
  console.log(`total: gc count: ${gcCounts}, gc time: ${totalGCTime.toFixed(3)}`);
  console.log(gcTypeCounts);
  //console.log(gcFlagCounts);

  console.log('done');
});


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

// a little help
function usage (...args) {
  console.log('invalid input:', ...args);
  console.log('usage: node index.js version function [...function]');
  console.log('  version is v1 or v2');
  console.log('  function is one of...');
}
