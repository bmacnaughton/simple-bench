'use strict';

/* eslint-disable no-console */

// the strategy here is to build the object that will be the JSON output
// first. then, if text output, just use the data in the json object for
// the text output. if json output, just write the json object to stdout.
function summarize(benchmarkData, options) {
  const {
    config, runSettings, gcStats, gTimes, memory, noopTime, warmupTime
  } = benchmarkData;
  options = Object.assign({json: true}, options);

  const json = makeObject(benchmarkData);

  // not sure memory is useful at all. maybe remove this.
  if (memory) {
    const kmu = json.memory.heapUsedKB;
    const kmuMean = f0(mean(kmu));
    const kmuVector = kmu.map(m => f0(m));
    console.log(`[mem mean ${kmuMean}k (${kmuVector.join(', ')})]`);
  }

  //
  // the single piece of key, "clean.meanPerIteration" is the key piece of information to use.
  //
  if (options.json) {
    console.log(JSON.stringify(json));
    return;
  }

  // don't duplicate the immediate feedback given in simple-bench.js.
  //console.log(`[function chain: ${json.params.functionChain.join(', ')}]`);
  //console.log(`[${json.params.groupIterations} iterations x ${json.params.groupCount} groups (${json.params.groupWaitMS}ms intergroup pause)]`);
  if (!options.terse) {
    console.log(`[gc count: ${json.gc.count}, gc time: ${f3(json.gc.time)}]`);
    if (runSettings.noop) {
      const noop = json.raw.noopTime;
      const npi = noop / json.params.warmupIterations;
      const warmup = json.raw.warmupTime;
      const wpi = warmup / json.params.warmupIterations;
      console.log(`[time(perIter) noop: ${f3(noop)}(${f4(npi)}), warmup: ${f3(warmup)}(${f4(wpi)}]`);
    }
    console.log(`[group times: ${fmttimes(json.raw.times)}]`);
    const {mean, stddev} = json.raw;
    const meanPerIter = mean / json.params.groupIterations;
    console.log(`[raw group mean ${f3(mean)} stddev ${f3(stddev)} (${f3(meanPerIter)} per iteration)]`);
    if (json.outliers.times.length) {
      console.log(`[excluding times outside ${f3(json.raw.mean)} +/- ${f2(range)}: ${fmttimes(json.outliers.times)}]`);
      //console.log(`  [group times: ${fmttimes(json.clean.times)}]`);
      console.log(`  [clean group mean ${f3(json.clean.mean)} (${f3(json.clean.mean / json.params.groupIterations)} per iteration) stddev ${f3(json.clean.stddev)}]`);
    } else {
      const t = `(${f3(json.raw.mean)} +/- ${json.params.stddevRange} * ${f3(json.raw.stddev)})`;
      console.log(`[all group times within ${f2(json.clean.lowRange)} to ${f2(json.clean.highRange)} ${t}]`);
    }
  } else {
    // terse provides basic output
    console.log(`[gc count: ${json.gc.count}, gc time: ${f3(json.gc.time)}]`);
    const { outliers, clean, raw } = json;
    const mean = outliers.times.length ? clean.mean : raw.mean;
    console.log(`[group clean mean ${f3(mean)} raw stddev ${f3(raw.stddev)} outliers ${outliers.times.length}]`);
  }
  console.log(`[mean: ${json.clean.meanPerIteration.toPrecision(4)} per iteration]`);
}

function fmttimes(t) {
  return t.map((t) => f2(t)).join(', ');
}

function f0(n) {
  return n.toFixed(0);
}

function f2(n) {
  return n.toFixed(2);
}

function f3(n) {
  return n.toFixed(3);
}

function f4(n) {
  return n.toFixed(4);
}

//
// summarization functions
//
function stats(array) {
  const n = array.length;
  const total = array.reduce((tot, v) => tot + v, 0);
  const mean = total / n;
  const stddev = variance(array) ** 0.5;

  return {n, total, mean, stddev};
}

function mean(array) {
  return array.reduce((tot, v) => tot + v, 0) / array.length;
}

function variance(array) {
  const average = mean(array);
  return mean(array.map((num) => (num - average) ** 2));
}

// make the internal representation of the data. this is used for the JSON
// output as well.

function makeObject(benchmarkData) {
  const {
    config, runSettings, gcStats, gTimes, memory, noopTime, warmupTime
  } = benchmarkData;

  const obj = {};

  obj.params = {
    functionChain: runSettings.functionNames,
    warmupIterations: config.warmupIterations,
    groupIterations: config.groupIterations,
    groupCount: config.groupCount,
    groupWaitMS: config.groupWaitMS,
    stddevRange: config.stddevRange,
  };
  obj.gc = {
    count: gcStats.gcCounts,
    time: gcStats.totalGCTime,
  };

  const { _n, total: _rawTotal, mean: rawMean, stddev: rawStddev } = stats(gTimes);
  obj.raw = {
    times: gTimes,
    mean: rawMean,
    meanPerIteration: rawMean / obj.params.groupIterations,
    stddev: rawStddev,
  };
  if (runSettings.noop) {
    obj.raw.noopTime = noopTime;
    obj.raw.noopPerIteration = noopTime / obj.params.warmupIterations;
    obj.raw.warmupTime = warmupTime;
    obj.raw.warmupPerIteration = warmupTime / obj.params.warmupIterations;
  }

  // find which group times are within the standard deviation range. refine
  // the dataset by throwing out those outside. if running on a dedicated
  // benchmarking machine, this generally isn't an issue, but when running
  // on desktops with anti-virus and other intermittent interruptions, it's
  // usually helpful to remove outliers.
  const keep = [];
  const lose = [];
  const range = obj.params.stddevRange * rawStddev;
  const low = (rawMean - range) < 0 ? 0.0 : rawMean - range;
  const high = rawMean + range;
  for (const time of obj.raw.times) {
    if (time < low || time > high) {
      lose.push(time);
    } else {
      keep.push(time);
    }
  }
  obj.clean = {
    times: keep,
    lowRange: low,
    highRange: high,
    mean: obj.raw.mean,
    meanPerIteration: obj.raw.meanPerIteration,
    stddev: obj.raw.stddev,
  };
  obj.outliers = {
    times: lose,
  };

  if (lose.length) {
    const { mean, stddev } = stats(keep);
    const im = mean / obj.params.groupIterations;
    obj.clean.mean = mean;
    obj.clean.stddev = stddev;
    obj.clean.meanPerIteration = im;
  }

  // consider removing this; it's not really useful afaict.
  if (memory) {
    const heapUsedKB = memory.map(m => m.heapUsed / 1024);
    const heapMeanKB = f0(mean(kmu));
    obj.memory = {
      heapUsedKB,
      heapMeanKB
    };
  }

  return obj;
}

module.exports = {
  summarize,
};
