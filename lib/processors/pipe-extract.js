'use strict';

const split = require('split');
const through = require('through');

const makeCSV = require('./pipe-make-csv');

function filter() {
  return through(function(data) {
    if (data && data[0] === '{') {
      this.emit('data', data);
    }
  });
}

let agg = {
  big: {
    jsTraverse: {},
    scoreBody: {},
    rustTraverse: {},
    rawParse: {},
    stringify: {},
  },
  many: {
    jsTraverse: {},
    scoreBody: {},
    rustTraverse: {},
    rawParse: {},
    stringify: {},
  },
  single: {
    jsTraverse: {},
    scoreBody: {},
    rustTraverse: {},
    rawParse: {},
    stringify: {},
  },
  other: {
    jsTraverse: {},
    scoreBody: {},
    rustTraverse: {},
    rawParse: {},
    stringify: {},
  },
}
function aggregate(jsonLine) {
  let {functionChain: [size, data, bench], mean: meanPerIteration} = jsonLine;
  if (bench === undefined) {
    bench = data;
    data = 'other';
  } else if (data === 'pass') {
    data = 'other';
  }
  agg[data][bench][size] = meanPerIteration;
}

function mapAndAggregate() {
  return through(
    function(data) {
      let parsed = JSON.parse(data);
      parsed = {functionChain: parsed.params.functionChain, mean: parsed.clean.meanPerIteration};
      aggregate(parsed);

      this.emit('data', JSON.stringify(parsed) + '\n');
    },
    function end() {
      this.emit('data', JSON.stringify(agg) + '\n');
      this.emit('end');
    }
  );
}

process.stdin
  .pipe(split())
  .pipe(filter())
  .pipe(mapAndAggregate())
  .pipe(split())
  .pipe(makeCSV())
  .pipe(process.stdout);



