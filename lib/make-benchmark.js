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
    functionNames,
    memory,
    verbose,
    perFunctionTiming,
  } = runSettings;

  const groupTimes = []; //Array(groupCount);
  // fold on the fly?
  const funcTimes = []; //Array(groupCount * groupIterations * functionChain.length);
  for (let i = 0; i < functionChain.length; i++) {
    funcTimes.push([]);
  }
  let gcCounts = 0;
  let totalGCTime = 0;
  const mem = Array(groupCount);


  //
  // setup measurements with performance hooks
  //
  const funcTimesPrefixLen = 'func-time-'.length;

  const obs = new PerfObserver((list) => {
    const entries = list.getEntries();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.entryType === 'measure') {
        if (entry.name === 'iteration-time') {
          groupTimes.push(entry.duration);
        } else if (entry.name.startsWith('func-time-')) {
          const funcIx = entry.name.substring(funcTimesPrefixLen, entry.name.indexOf('-', funcTimesPrefixLen));
          funcTimes[funcIx].push(entry.duration);
        }
        verbose && console.log(`perf ${entry.name}: ${entry.duration}`);
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

  // make the names once
  const funcTimeNames = Array(functionNames.length);
  for (let i = 0; i < functionNames.length; i++) {
    funcTimeNames[i] = `func-time-${i}-${functionNames[i]}`;
  }

  const xq = perFunctionTiming ? execute : untimedExecute;

  //
  // execute functionChains
  //
  async function execute() {
    let lastResult = undefined;
    perf.mark('function-chain-start');
    for (let i = 0; i < functionChain.length; i++) {
      lastResult = await functionChain[i](lastResult);
      perf.measure(funcTimeNames[i], 'function-chain-start');
    }
  }

  async function untimedExecute() {
    let lastResult = undefined;
    for (let i = 0; i < functionChain.length; i++) {
      lastResult = await functionChain[i](lastResult);
    }
  }

  //
  // function to run the setups, tests, and final.
  //
  async function test() {
    // call the tester's setup
    if (setup) {
      await (async () => setup(config, runSettings))();
    }
    if (groupSetup) {
      await (async () => groupSetup(config, runSettings))();
    }
    // warmup
    for (let i = warmupIterations; i > 0; i--) {
      await untimedExecute(functionChain);
    }
    await pause(groupWaitMS);

    // execute x groups of y iterations with a pause after each group
    for (let i = 0; i < groupCount; i++) {
      // setup for the group
      if (groupSetup) {
        await (async () => groupSetup(config))();
      }
      perf.mark('iteration-start');
      for (let i = groupIterations; i > 0; i--) {
        await xq(functionChain);
      }
      perf.measure('iteration-time', 'iteration-start');
      if (memory) {
        mem[i] = process.memoryUsage();
      }
      await pause(groupWaitMS);
    }

    // final pause - wait extra time to let GC finish.
    await pause(groupWaitMS * 10);

    // call the tester's final
    if (final) {
      await (async () => final(config, runSettings));
    }

    //
    return pause(groupWaitMS)
      .then(() => {
        obs.disconnect();
        const gTimes = groupTimes.slice();
        // const gTimes = [];
        // if (perFunctionTiming) {
        //   const functionTimes = Array(functionChain.length);
        //   for (let i = 0; i < groupTimes.length; i++) {
        //     if (groupTimes[i].name.startsWith('func-time-')) {
        //       const startIx = 'func-time-'.length;
        //       const endIx = groupTimes[i].name.indexOf('-', startIx);
        //       const funcIx = groupTimes[i].name.substring(startIx, endIx);
        //       functionTimes[funcIx].push(groupTimes[i]);
        //     } else if (groupTimes[i].name === 'iteration-time') {
        //       gTimes.push(groupTimes[i]);
        //     } else {
        //       throw new Error(`unexpected measure name ${groupTimes[i].name}`);
        //     }
        //   }
        // }
        const gcStats = { gcCounts, totalGCTime };
        const benchmarkData = { gTimes, gcStats, config, runSettings };
        if (memory) {
          benchmarkData.memory = mem;
        }
        if (perFunctionTiming) {
          benchmarkData.fTimes = funcTimes;
        }
        return benchmarkData;
      });
  }

  return test;
}

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = makeBenchmark;
