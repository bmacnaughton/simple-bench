'use strict';

/* eslint-disable no-console */

const defaultConfig = {
  warmupIterations: 100,
  groupIterations: 100000,
  groupCount: 10,
  groupWaitMS: 1000,
  stddevRange: 2,
};

const numPropsToEnvMap = {
  warmupIterations: 'WARMUP_ITERATIONS',
  groupIterations: 'GROUP_ITERATIONS',
  groupCount: 'GROUP_COUNT',
  groupWaitMS: 'GROUP_WAIT_MS',
  // handle STDDEV_RANGE specially because it can be a float
  //stddevRange: 'STDDEV_RANGE',
};

const boolOptionsToEnvMap = {
  memCheck: 'MEM_CHECK',
  debug: 'DEBUG',
  verify: 'VERIFY',
  terse: 'TERSE',
  verbose: 'VERBOSE',
  json: 'JSON',
};

function getRunSettings(benchmarkConfig, benchmarkFunctions) {
  const overrideConfig = {};
  const runSettings = {};

  for (const key in defaultConfig) {
    const envKey = numPropsToEnvMap[key];
    if (envKey in process.env) {
      const value = process.env[envKey];
      if (!/^\+?\d+$/.test(value)) {
        throw new Error(`env var ${envKey} must be a positive integer, not ${value}`);
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
  for (const key in boolOptionsToEnvMap) {
    const envKey = boolOptionsToEnvMap[key];
    // the presence of the env var is enough.
    runSettings[key] = envKey in process.env;
  }

  // the final settings
  const config = Object.assign({}, defaultConfig, benchmarkConfig, overrideConfig);

  // validate
  for (const p of ['warmupIterations', 'groupIterations', 'groupCount', 'groupWaitMS']) {
    const value = config[p];
    if (typeof value !== 'number' || !/^\+?\d+$/.test(value.toString())) {
      throw new Error(`${p} must be a positive integer, not ${value}`);
    }
  }

  const stddevRange = config.stddevRange;
  if (!stddevRange || stddevRange <= 0 || typeof stddevRange !== 'number') {
    throw new Error(`stddevRange must be a positive number, not ${stddevRange}`);
  }

  //
  // parse the command line. it's of the form options function-names
  //
  let args = process.argv.slice(2);

  const functionNames = [];
  // this hack is to deal with vscode's debugger "prompt" though the JavaScript
  // debug terminal removes the need for this crap.
  if (args.length === 1 && args[0].includes(',')) {
    args = args[0].split(',');
  }

  const functionChain = [];
  for (const arg of args) {
    if (arg in benchmarkFunctions) {
      // a test can be a sequence of tests. that requires looping
      // on process.argv and adding tests to functionChain.
      if (benchmarkFunctions[arg].constructor.name === 'AsyncFunction') {
        functionChain.push(benchmarkFunctions[arg]);
      } else {
        functionChain.push(async x => benchmarkFunctions[arg](x));
      }
      functionNames.push(arg);
    } else if (arg === '-m' || arg === '--memcheck') {
      runSettings.memCheck = true;
    } else if (arg === '-d' || arg === '--debug') {
      runSettings.debug = true;
    } else if (arg === '--verify') {
      runSettings.verify = true;
    } else if (arg === '--terse') {
      runSettings.terse = true;
    } else if (arg === '--verbose') {
      runSettings.verbose = true;
    } else if (arg === '--json') {
      runSettings.json = true;
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
    } else if (arg.startsWith('-')) {
      throw new Error(`unrecognized argument: ${arg}`);
    } else {
      throw new Error(`simple-bench: invalid function-chain function: ${arg}`);
    }
  }

  runSettings.functionNames = functionNames;
  runSettings.functionChain = functionChain;

  return { config, runSettings };

}

module.exports = getRunSettings;
