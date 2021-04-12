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

const warmup = 100;

const interationsPerGroup = 100000;
const groupCount = 10;
const groupWaitMS = 1000;

const groupTimes = [];
let gcCounts = 0;
let totalGCTime = 0;

let functionChain;

// take from env?
const arg = process.argv[2];
if (arg in tests) {
  // in theory a test can be a sequence of tests. that requires looping
  // on process.argv and adding tests to functionChain.
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

//
// function to run the tests
//
async function test() {
  // warmup
  for (let i = warmup; i > 0; i--) {
    execute(functionChain);
  }
  await pause(groupWaitMS);

  // execute x groups of y iterations with a pause after each group
  for (let i = groupCount; i > 0; i--) {
    perf.mark('start-iteration');
    for (let i = interationsPerGroup; i > 0; i--) {
      execute(functionChain);
    }
    perf.measure('iteration-time', 'start-iteration');
    await pause(groupWaitMS);
  }

  // final pause
  await pause(groupWaitMS);
}

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//
// execute the tests then report
//
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
