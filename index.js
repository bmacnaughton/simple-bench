#!/usr/bin/env node
'use strict';

const path = require('path');

const {summarize} = require('./lib/summarize');

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

// this file executes tests imported from a definitions file.

const perf_hooks = require('perf_hooks');
const {performance: perf, PerformanceObserver: PerfObserver} = perf_hooks;
const util = require('util');


// hacky config
const terse = !!process.env.TERSE;
const json = !!process.env.JSON;

let benchmarkFile = './benchmarks/definitions';
if (process.env.BENCH) {
  benchmarkFile = path.resolve(process.env.BENCH);
}
const definitions = require(benchmarkFile);

const {
  configure,
  setup,
  groupSetup,
  tests,
  final
} = definitions;

// noop that returns its argument.
if (!tests.noop) {
  tests.noop = async s => s;
}
// noop that returns undefined
if (!tests.noopUndef) {
  tests.noopUndef = async() => undefined;
}
if (!tests.noopu) {
  tests.noopu = async() => undefined;
}
if (!tests.debug) {
  tests.debug = async s => {
    // eslint-disable-next-line no-debugger
    debugger;
    return s;
  };
}

const defaultConfig = {
  warmupIterations: 100,
  groupIterations: 100000,
  groupCount: 10,
  groupWaitMS: 1000,
  stddevRange: 2,
};

const propToEnvMap = {
  warmupIterations: 'WARMUP_ITERATIONS',
  groupIterations: 'GROUP_ITERATIONS',
  groupCount: 'GROUP_COUNT',
  groupWaitMS: 'GROUP_WAIT_MS',
  // handle STDDEV_RANGE specially because it can be a float
  //stddevRange: 'STDDEV_RANGE',
};

const overrideConfig = {};

for (const key in defaultConfig) {
  const envKey = propToEnvMap[key];
  if (envKey in process.env) {
    const value = process.env[envKey];
    if (!/^\+?\d+$/.test(value)) {
      throw new Error(`env var ${envKey} must be a positive integerm not ${value}`);
    }
    overrideConfig[key] = +process.env[envKey];
  }
}
if ('STDDEV_RANGE' in process.env) {
  const value = parseFloat(process.env.STDDEV_RANGE);
  if (isNaN(value) || value <= 0) {
    throw new Error(`env var STDDEV_RANGE must be a positive number, not ${process.env.STDDEV_RANGE}`);
  }
  overrideConfig.stddevRange = value;
}

const userConfig = configure ? configure() : {};
const config = Object.assign({}, defaultConfig, userConfig, overrideConfig);
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
    console.log('  -m do memcheck too (not usually helpful)');
    console.log('  -d debug (output the function chain constructor names)');
    console.log('to use a benchmark file other than ./benchmark/definitions.js:');
    console.log('$ BENCH=./example.js node index.js smallText expand');
    console.log('to output json instead of text:');
    console.log('$ JSON=1 node index.js smallText expand');
    console.log('to output terse text instead of verbose text:');
    console.log('$ TERSE=1 node index.js smallText expand');
    console.log('JSON and TERSE accept any non-empty value');
    process.exit(0);
  } else {
    console.log('simple-bench: invalid function-chain function:', arg);
    // eslint-disable-next-line
    process.exit(1);
  }
}
config.functionChain = functionNames.slice();

if (!json) {
  console.log(`[function chain: ${functionNames.join(', ')}]`);
  console.log(`[${groupIterations} iterations x ${groupCount} groups (${groupWaitMS}ms intergroup pause) stddevRange ${stddevRange}]`);
  if (debug) {
    for (const fn of functionChain) {
      console.log(fn.constructor.name);
    }
  }
} else {
  console.log(JSON.stringify({
    functionChain: functionNames,
    groupIterations,
    groupCount,
    groupWaitMS,
  }));
}

let gcTypes;
const k = perf_hooks.constants;
// major changed from 2 to 4 for some reason.
if (k.NODE_PERFORMANCE_GC_MAJOR === 4) {
  gcTypes = {
    [k.NODE_PERFORMANCE_GC_MAJOR] : 'major',
    [k.NODE_PERFORMANCE_GC_MINOR] : 'minor',
    [k.NODE_PERFORMANCE_GC_INCREMENTAL] : 'incr',
    [k.NODE_PERFORMANCE_GC_WEAKCB] : 'weak',
  };
} else {
  gcTypes = {
    [k.NODE_PERFORMANCE_GC_MINOR]: 'minor',      // 1
    [k.NODE_PERFORMANCE_GC_MAJOR]: 'major',      // 2
    [k.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incr', // 4
    [k.NODE_PERFORMANCE_GC_WEAKCB]: 'weak',      // 8
  };
}

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

  // final pause - wait extra time to let GC finish.
  await pause(groupWaitMS * 10);
  return pause(groupWaitMS);
}


//
// execute functionChains
//
async function execute(fc) {
  let lastResult = undefined;
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

  summarize(data, { json, terse });
});

