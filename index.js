#!/usr/bin/env node
'use strict';

const path = require('path');

const getRunSettings = require('./lib/get-run-settings');
const makeBenchmark = require('./lib/make-benchmark');
const { makeJson, outputText } = require('./lib/summarize');

/* eslint-disable no-console */

// this file reads a benchmark definition file, adds some default benchmark functions,
// gets the configuration for run, executes the benchmark, and prints a result summary.

let benchmarkFile = './benchmarks/definitions';
if (process.env.BENCH) {
  benchmarkFile = path.resolve(process.env.BENCH);
}

const definitions = require(benchmarkFile);

const {
  configure,
  // hooks
  setup,
  groupSetup,
  final,
  // the benchmark functions. the "tests" name is historical.
  tests: benchmarkFuncs,
} = definitions;

// add standard functions if the benchmark doesn't redefine them
const defaultFunctions = {
  noop: async s => s,
  noopUndef: async () => undefined,
  noopu: async () => undefined,
  debug: async s => {
    // eslint-disable-next-line no-debugger
    debugger;
    return s;
  },
};

for (const f of Object.keys(defaultFunctions)) {
  if (!benchmarkFuncs[f]) {
    benchmarkFuncs[f] = defaultFunctions[f];
  }
}

// call the user's configure function if it's present. probably should just be an object.
const benchmarkDefaultConfig = configure ? configure() : {};

const { config, runSettings } = getRunSettings(benchmarkDefaultConfig, benchmarkFuncs);

const {
  groupCount,
  groupIterations,
  groupWaitMS,
  stddevRange,
} = config;

const {
  functionNames,
} = runSettings;

if (!runSettings.json) {
  console.log(`[function chain: ${functionNames.join(', ')}]`);
  console.log(`[${groupIterations} iterations x ${groupCount} groups (${groupWaitMS}ms intergroup pause) stddevRange ${stddevRange}]`);
  if (runSettings.debug) {
    for (const fn of runSettings.functionChain) {
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

const hooks = { setup, groupSetup, final };

const benchmark = makeBenchmark(config, hooks, runSettings);

benchmark()
  .then(benchmarkData => {
    const json = makeJson(benchmarkData, runSettings);
    if (runSettings.json) {
      console.log(JSON.stringify(json));
    } else {
      outputText(json, runSettings);
    }
  });
