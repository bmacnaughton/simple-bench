'use strict';

/* eslint-disable no-console */

// the strategy here is to build the object that will be the JSON output
// first. then, if text output, just use the data in the json object for
// the text output. if json output, just write the json object to stdout.
function makeJson({gcStats, gTimes, config, runSettings, memory, fTimes }, _options) {
  // write json at end.
  const json = {};
  json.params = {
    functionChain: runSettings.functionNames,
    warmupIterations: config.warmupIterations,
    groupIterations: config.groupIterations,
    groupCount: config.groupCount,
    groupWaitMS: config.groupWaitMS,
    stddevRange: config.stddevRange,
  };
  json.runSettings = Object.assign({}, runSettings);
  delete json.runSettings.functionChain; // this is the functions themselves - not serializable

  json.gc = {
    count: gcStats.gcCounts,
    time: gcStats.totalGCTime,
  };

  const { total: _rawTotal, mean: rawMean, stddev: rawStddev } = stats(gTimes);
  json.raw = {
    times: gTimes,
    mean: rawMean,
    meanPerIteration: rawMean / json.params.groupIterations,
    stddev: rawStddev,
  };

  if (fTimes) {
    json.functionTimes = {};
    // fTimes are functionChain.length arrays of each function's
    // time from the *beginning* of the function chain. to get each
    // function's actual time, subtract the previous function's time
    // from the current function's time.
    const fTimesAbs = [fTimes[0].slice()];
    for (let i = fTimes.length - 1; i > 0; i--) {
      fTimesAbs[i] = [];
      for (let j = 0; j < fTimes[i].length; j++) {
        fTimesAbs[i][j] = fTimes[i][j] - fTimes[i - 1][j];
      }
    }

    for (let i = 0; i < fTimesAbs.length; i++) {
      const { mean, stddev } = stats(fTimesAbs[i]);
      console.log(runSettings.functionNames[i], mean, stddev);
      json.functionTimes[runSettings.functionNames[i]] = {
        times: fTimesAbs[i],
        mean,
        meanPerIteration: mean / json.params.groupIterations,
        stddev,
      };
    }
  }

  // figure out which times are within the standard deviation range. refine
  // the dataset by throwing out those outside. if running on a dedicated
  // benchmarking machine, this generally isn't an issue, but when running
  // on desktops with anti-virus and other intermittent interruptions, it's
  // usually helpful to remove outliers.
  const keep = [];
  const lose = [];
  const range = json.params.stddevRange * rawStddev;
  const low = (rawMean - range) < 0 ? 0.0 : rawMean - range;
  const high = rawMean + range;
  for (const time of json.raw.times) {
    if (time < low || time > high) {
      lose.push(time);
    } else {
      keep.push(time);
    }
  }
  json.clean = {
    times: keep,
    range,
    lowRange: low,
    highRange: high,
    mean: json.raw.mean,
    meanPerIteration: json.raw.meanPerIteration,
    stddev: json.raw.stddev,
  };
  json.outliers = {
    times: lose,
  };

  if (lose.length) {
    const {mean, stddev} = stats(keep);
    const im = mean / json.params.groupIterations;
    json.clean.mean = mean;
    json.clean.stddev = stddev;
    json.clean.meanPerIteration = im;
  }

  if (memory) {
    const kmu = memory.map(m => m.heapUsed / 1024);
    const kmuMean = f0(mean(kmu));
    const kmuVector = kmu.map(m => f0(m));
    console.log(`[mem mean ${kmuMean}k (${kmuVector.join(', ')})]`);
  }

  return json;

}

function outputText(json, options) {
  // don't duplicate the immediate feedback given in simple-bench.js.
  //console.log(`[function chain: ${json.params.functionChain.join(', ')}]`);
  //console.log(`[${json.params.groupIterations} iterations x ${json.params.groupCount} groups (${json.params.groupWaitMS}ms intergroup pause)]`);
  if (!options.terse) {
    console.log(`[gc count: ${json.gc.count}, gc time: ${f3(json.gc.time)}]`);
    console.log(`[group times: ${fmttimes(json.raw.times)}]`);
    const {mean, stddev} = json.raw;
    const meanPerIter = mean / json.params.groupIterations;
    console.log(`[raw group mean ${f3(mean)} stddev ${f3(stddev)} (${f3(meanPerIter)} per iteration)]`);
    if (json.outliers.times.length) {
      console.log(`[excluding times outside ${f3(json.raw.mean)} +/- ${f2(json.clean.range)}: ${fmttimes(json.outliers.times)}]`);
      //console.log(`  [group times: ${fmttimes(json.clean.times)}]`);
      console.log(`  [clean group mean ${f3(json.clean.mean)} (${f3(json.clean.mean / json.params.groupIterations)} per iteration) stddev ${f3(json.clean.stddev)}]`);
    } else {
      const t = `(${f3(json.raw.mean)} +/- ${json.params.stddevRange} * ${f3(json.raw.stddev)})`;
      console.log(`[all group times within ${f2(json.clean.lowRange)} to ${f2(json.clean.highRange)} ${t}]`);
    }
  } else {
    // terse provides basic output
    console.log(`[gc count: ${json.gc.count}, gc time: ${f3(json.gc.time)}]`);
    const mean = json.outliers.times.length ? json.clean.mean : json.raw.mean;
    console.log(`[group clean mean ${f3(mean)} raw stddev ${f3(json.raw.stddev)}]`);
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

module.exports = {
  makeJson,
  outputText,
};
