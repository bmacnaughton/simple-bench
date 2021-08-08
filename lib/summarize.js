'use strict';

/* eslint-disable no-console */

function summarize({stddevRange, gcStats, gTimes, config}) {
  const n = gTimes.length;
  const rawTotal = gTimes.reduce((tot, v) => tot + v, 0);
  const rawMean = rawTotal / n;
  const rawStddev = stddev(gTimes);
  const {gcCounts, totalGCTime} = gcStats;
  const {groupIterations} = config;

  console.log(`group times: [${fmttimes(gTimes)}]`);

  let keep = gTimes;
  const lose = [];
  if (stddevRange) {
    const range = stddevRange * rawStddev;
    const low = rawMean - range;
    const high = rawMean + range;
    keep = [];
    for (const time of gTimes) {
      if (time < low || time > high) {
        lose.push(time);
      } else {
        keep.push(time);
      }
    }
    const rm = f3(rawMean);
    const im = f3(rawMean / groupIterations);
    const rsd = f3(rawStddev);
    console.log(`group mean ${rm} (${im} per iteration) stddev ${rsd}`);
    console.log(`total: gc count: ${gcCounts}, gc time: ${f3(totalGCTime)}`);
    if (lose.length) {
      console.log(`excluding times outside ${rm} +/- ${f3(range)}: [${fmttimes(lose)}]`);
      const {mean, stddev: stddeviation} = stats(keep);
      const im = f3(mean / groupIterations);
      console.log(`  group times: [${fmttimes(keep)}]`);
      console.log(`  group mean ${f3(mean)} (${im} per iteration) stddev ${f3(stddeviation)}`);
    } else {
      const t = `(${rm} +/- ${stddevRange} * ${rsd})`;
      console.log(`all group times within ${f2(low)} to ${f2(high)} ${t}`);
    }
  }

  console.log('');
}

function fmttimes(t) {
  return t.map((t) => f2(t)).join(', ');
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

function stddev(array) {
  return variance(array) ** 0.5;
}

module.exports = {
  summarize,
};
