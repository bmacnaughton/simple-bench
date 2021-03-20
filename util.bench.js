'use strict';
/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

const perf_hooks = require('perf_hooks');
const { performance: perf, PerformanceObserver: PerfObserver } = perf_hooks;
const util = require('util');

const tests = require('./test-definitions');

// take from env?
// add .remove() vs .removeInPlace() test
// add .filterMatching() comparison - the impact of lodash, nothing more
// ditto .filterNonSupersetGroups() and .tagRangesEncompass()
const [version, ...args] = process.argv.slice(2);
let argMethod;

if (!tests[version]) {
  usage(version, ...args);
  // eslint-disable-next-line
  process.exit(1);
}

const selectedTests = tests[version];

const functionChain = [];
const unknown = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] in selectedTests) {
    functionChain.push(selectedTests[args[i]]);
  } else if (args[i] in tests.abbreviations) {
    functionChain.push(selectedTests[tests.abbreviations[args[i]]]);
  } else {
    unknown.push(args[i]);
  }
}
if (functionChain.length === 0) {
  if (selectedTests.default) {
    functionChain.push(selectedTests.default);
  } else {
    console.log('no valid functions specified');
    usage(version, ...args);
    process.exit(1);
  }
}
if (unknown.length) {
  console.warn('unknown functions:', unknown.join(', '));
}

const execute = {
  value: executeChainByValue,
  reference: executeChainByReference
}[tests[version].signature];

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
      totalGCTime += entry.duration;
    }
  }
});
obs.observe({entryTypes: ['measure', 'gc'], buffered: true});

const warmup = 100;

const interationsPerGroup = 100000;
const groupCount = 10;
const groupWaitMS = 500;

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
  const nGroups = iTimes.length;
  const total = iTimes.reduce((tot, v) => tot + v, 0);
  console.log(`group times: [${iTimes.map((t) => t.toFixed(2)).join(', ')}]`);
  console.log(`average per ${interationsPerGroup}: ${(total/nGroups).toFixed(3)}`);
  console.log(`standard deviation of ${nGroups} groups: ${stddev(iTimes).toFixed(3)}`)
  console.log(`total: gc count: ${gcCounts}, gc time: ${totalGCTime.toFixed(3)}`);
  console.log(gcTypeCounts);

  console.log('done');
});

//
// execute functionChains
//
function executeChainByValue(fc) {
  let lastResult = [];
  for (let i = 0; i < fc.length; i++) {
    lastResult = fc[i](lastResult);
  }
}

function executeChainByReference(fc) {
  let reference = [];
  for (let i = 0; i < fc.length; i++) {
    fc[i](reference);
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

// a little help
function usage (...args) {
  console.log('invalid input:', ...args);
  console.log('usage: node index.js version function [...function]');
  console.log('  version is v1 or v2');
  console.log('  function is one of...');
}
