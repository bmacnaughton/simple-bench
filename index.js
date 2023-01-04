#!/usr/bin/env node
'use strict';

const {summarize} = require('./lib/summarize');

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

// this file executes tests imported from
// test-definitions.

const perf_hooks = require('perf_hooks');
const {performance: perf, PerformanceObserver: PerfObserver} = perf_hooks;
const util = require('util');

const definitions = require('./benchmark/definitions');
const {
  configure,
  setup,
  groupSetup,
  tests,
  final
} = definitions;

if (!tests.noop) {
  tests.noop = async s => s;
}
if (!tests.noopu) {
  tests.noopu = async() => undefined;
}

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

if (!stddevRange) {
  console.log('the stddevRange must be a non-zero number:', stddevRange);
  process.exit(1);
}
//
// this mess of args parsing probably belongs in another module.
//
const groupTimes = [];
let gcCounts = 0;
let totalGCTime = 0;
let memCheck = false;
let debug = false;
const memory = Array(groupCount);
const functionNames = [];
// take from env?
let args = process.argv.slice(2);
// this little trick is to deal with vscode's debugger "prompt"
if (args.length === 1 && args[0].includes(',')) {
  args = args[0].split(',');
}
const functionChain = [];
for (const arg of args) {
  if (arg in tests) {
    // a test can be a sequence of tests. that requires looping
    // on process.argv and adding tests to functionChain.
    if (tests[arg].constructor.name === 'AsyncFunction') {
      functionChain.push(tests[arg]);
    } else {
      functionChain.push(async x => tests[arg](x));
    }
    functionNames.push(arg);
  } else if (arg === '-m') {
    memCheck = true;
  } else if (arg === '-d') {
    debug = true;
  } else if (arg === '-h' || arg === '--help') {
    console.log('simple-bench function-chain');
    console.log('all times reported in milliseconds');
    process.exit(0);
  } else {
    console.log('simple-bench: invalid function-chain function:', arg);
    // eslint-disable-next-line
    process.exit(1);
  }
}
config.functionChain = functionNames.slice();


console.log(`[function chain: ${functionNames.join(', ')}]`);
console.log(`[${groupIterations} iterations x ${groupCount} groups (${groupWaitMS}ms intergroup pause)]`);
if (debug) {
  for (const fn of functionChain) {
    console.log(fn.constructor.name);
  }
}


const gcTypes = {
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR]: 'minor',      // 1
  [perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR]: 'major',      // 2
  [perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incr', // 4
  [perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB]: 'weak',      // 8
};

//
// setup measurements with performance hooks
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
      if (verbose) {
        const {kind, flags} = entry.detail ? entry.detail : entry;
        console.log(`perf gc: ${entry.duration} (${gcTypes[kind]}) flags: ${flags}`);
      }
      gcCounts += 1;
      totalGCTime += entry.duration;
    }
  }
});
obs.observe({entryTypes: ['measure', 'gc'], buffered: true});

//
// function to run the setups, tests, and final.
//
async function test() {
  // call the tester's setup
  if (definitions.setup) {
    await (async() => definitions.setup(config))();
  }
  if (groupSetup) {
    await (async() => groupSetup(config))();
  }
  // warmup
  for (let i = warmupIterations; i > 0; i--) {
    await execute(functionChain);
  }
  await pause(groupWaitMS);

  // execute x groups of y iterations with a pause after each group
  for (let i = 0; i < groupCount; i++) {
    // setup for the group
    if (groupSetup) {
      await (async() => groupSetup(config))();
    }
    perf.mark('start-iteration');
    for (let i = groupIterations; i > 0; i--) {
      await execute(functionChain);
    }
    perf.measure('iteration-time', 'start-iteration');
    if (memCheck) {
      memory[i] = process.memoryUsage();
    }
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
  const gTimes = groupTimes.slice();
  const gcStats = {gcCounts, totalGCTime};
  const data = {gTimes, gcStats, stddevRange, config};
  if (memCheck) {
    data.memory = memory;
  }
  // if the test-definitions specifies a final execute it. it can
  // be output or cleanup or whatever.
  if (final) {
    final(config);
  }
  summarize(data, { json: false, terse: false });
});

