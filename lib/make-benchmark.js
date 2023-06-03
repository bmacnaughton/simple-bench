'use strict';

/* eslint-disable no-console */

const perf_hooks = require('perf_hooks');
const { performance: perf, PerformanceObserver: PerfObserver } = perf_hooks;

let gcTypes;
const k = perf_hooks.constants;
// major changed from 2 to 4 for some reason.
if (k.NODE_PERFORMANCE_GC_MAJOR === 4) {
  gcTypes = {
    [k.NODE_PERFORMANCE_GC_MAJOR]: 'major',
    [k.NODE_PERFORMANCE_GC_MINOR]: 'minor',
    [k.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incr',
    [k.NODE_PERFORMANCE_GC_WEAKCB]: 'weak',
  };
} else {
  gcTypes = {
    [k.NODE_PERFORMANCE_GC_MINOR]: 'minor',      // 1
    [k.NODE_PERFORMANCE_GC_MAJOR]: 'major',      // 2
    [k.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incr', // 4
    [k.NODE_PERFORMANCE_GC_WEAKCB]: 'weak',      // 8
  };
}

function makeBenchmark(config, hooks, runSettings) {
  const {
    warmupIterations,
    groupWaitMS,
    groupCount,
    groupIterations,
  } = config;

  const {
    setup,
    groupSetup,
    final,
  } = hooks;

  const {
    functionChain,
    memCheck,
    verbose,
  } = runSettings;

  const groupTimes = [];
  let gcCounts = 0;
  let totalGCTime = 0;
  const memory = Array(groupCount);


  //
  // setup measurements with performance hooks
  //

  const obs = new PerfObserver((list) => {
    const entries = list.getEntries();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.entryType === 'measure') {
        verbose && console.log(`perf ${entry.name}: ${entry.duration}`);
        groupTimes.push(entry.duration);
      } else if (entry.entryType === 'gc') {
        if (verbose) {
          const { kind, flags } = entry.detail ? entry.detail : entry;
          console.log(`perf gc: ${entry.duration} (${gcTypes[kind]}) flags: ${flags}`);
        }
        gcCounts += 1;
        totalGCTime += entry.duration;
      }
    }
  });
  obs.observe({ entryTypes: ['measure', 'gc'], buffered: true });

  //
  // function to run the setups, tests, and final.
  //
  async function test() {
    // call the tester's setup
    if (setup) {
      await (async () => setup(config))();
    }
    if (groupSetup) {
      await (async () => groupSetup(config))();
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
        await (async () => groupSetup(config))();
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

    // call the tester's final
    if (final) {
      await (async () => final(config));
    }

    //
    return pause(groupWaitMS)
      .then(() => {
        obs.disconnect();
        const gTimes = groupTimes.slice();
        const gcStats = { gcCounts, totalGCTime };
        const benchmarkData = { gTimes, gcStats, config };
        if (memCheck) {
          benchmarkData.memory = memory;
        }
        return benchmarkData;
      });
  }

  return test;
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

module.exports = makeBenchmark;
