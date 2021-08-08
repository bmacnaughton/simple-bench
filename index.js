'use strict';

const {summarize} = require('./lib/summarize');

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

// this file executes tests it imports from
// test-definitions.

const perf_hooks = require('perf_hooks');
const {performance: perf, PerformanceObserver: PerfObserver} = perf_hooks;
const util = require('util');

const {configure, setup, groupSetup, tests} = require('./test-definitions');

const defaultConfig = {
  warmupIterations: 100,
  groupIterations: 100000,
  groupCount: 10,
  groupWaitMS: 1000,
  stddevRange: 2,
};

const userConfig = configure ? configure() : {};
const config = Object.assign({}, defaultConfig, userConfig);
const {
  warmupIterations,
  groupIterations,
  groupCount,
  groupWaitMS,
  stddevRange,
} = config;

console.log(`executing ${groupCount} groups of ${groupIterations} iterations (${groupWaitMS}ms intergroup pause)`);
console.log(`excluding group times outside ${stddevRange} * stddev`);

const groupTimes = [];
let gcCounts = 0;
let totalGCTime = 0;

// take from env?
const args = process.argv.slice(2);
const functionChain = [];
for (const arg of args) {
  if (arg in tests) {
    // in theory a test can be a sequence of tests. that requires looping
    // on process.argv and adding tests to functionChain.
    if (tests[arg].constructor.name === 'AsyncFunction') {
      functionChain.push(tests[arg]);
    } else {
      functionChain.push(async (x) => tests[arg](x));
    }
  } else if (arg === 'noop') {
    // predefined noop function. can help determine baselines
    functionChain.push(async s => s);
  } else {
    console.log('simple-bench: invalid function-chain function:', arg);
    // eslint-disable-next-line
    process.exit(1);
  }
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
  // call the tester's setup
  if (setup) {
    setup(config);
  }
  if (groupSetup) {
    groupSetup(config);
  }
  // warmup
  for (let i = warmupIterations; i > 0; i--) {
    await execute(functionChain);
  }
  await pause(groupWaitMS);

  // execute x groups of y iterations with a pause after each group
  for (let i = groupCount; i > 0; i--) {
    // setup for the group
    if (groupSetup) {
      groupSetup(config);
    }
    perf.mark('start-iteration');
    for (let i = groupIterations; i > 0; i--) {
      await execute(functionChain);
    }
    perf.measure('iteration-time', 'start-iteration');
    await pause(groupWaitMS);
  }

  // final pause
  await pause(groupWaitMS * 10);
  return pause(groupWaitMS);
}


//
// execute functionChains
//
async function execute(fc) {
  let lastResult = [];
  for (let i = 0; i < fc.length; i++) {
    lastResult = await fc[i](lastResult);
  }
}

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//
// execute the tests then report
//
test().then(() => {
  obs.disconnect();
  const gcStats = {gcCounts, totalGCTime};
  summarize({gTimes: groupTimes.slice(), gcStats, stddevRange, config});
});

