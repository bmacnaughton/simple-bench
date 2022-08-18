'use strict';

/* eslint-disable no-console */

function summarize({stddevRange, gcStats, gTimes, config, memory}) {
  const n = gTimes.length;
  const rawTotal = gTimes.reduce((tot, v) => tot + v, 0);
  const rawMean = rawTotal / n;
  const rawStddev = stddev(gTimes);
  const {gcCounts, totalGCTime} = gcStats;
  const {groupIterations} = config;

  console.log(`[group times: ${fmttimes(gTimes)}]`);

  let keep = gTimes;
  const lose = [];
  let finalMean;
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
    finalMean = im;
    const rsd = f3(rawStddev);
    console.log(`[group mean ${rm} (${im} per iteration) stddev ${rsd}]`);
    console.log(`[gc count: ${gcCounts}, gc time: ${f3(totalGCTime)}]`);
    if (lose.length) {
      console.log(`[excluding times outside ${rm} +/- ${f3(range)}: ${fmttimes(lose)}]`);
      const {mean, stddev: stddeviation} = stats(keep);
      const im = f3(mean / groupIterations);
      finalMean = im;
      console.log(`  [group times: ${fmttimes(keep)}]`);
      console.log(`  [group mean ${f3(mean)} (${im} per iteration) stddev ${f3(stddeviation)}`);
    } else {
      const t = `(${rm} +/- ${stddevRange} * ${rsd})`;
      console.log(`[all group times within ${f2(low)} to ${f2(high)} ${t}]`);
    }
  }
  if (memory) {
    const kmu = memory.map(m => m.heapUsed / 1024);
    const kmuMean = f0(mean(kmu));
    const kmuVector = kmu.map(m => f0(m));
    console.log(`[mem mean ${kmuMean}k (${kmuVector.join(', ')})]`);
  }
  console.log(`[mean: ${finalMean}]`);

  console.log('');
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

function stddev(array) {
  return variance(array) ** 0.5;
}

module.exports = {
  summarize,
};
