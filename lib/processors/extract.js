'use strict';

const split = require('split');
const through = require('through');

function filter() {
  return through(function(data) {
    if (data && data[0] === '{') {
      this.emit('data', data);
    }
  });
}

const agg = {
  big: {
    jsTraverse: {},
    scoreBody: {},
    rustTraverse: {},
    rawParse: {},
  },
  many: {
    jsTraverse: {},
    scoreBody: {},
    rustTraverse: {},
    rawParse: {},
  },
  single: {
    jsTraverse: {},
    scoreBody: {},
    rustTraverse: {},
    rawParse: {},
  },
};

function aggregate(jsonLine) {
  const {functionChain: [size, data, bench], mean: meanPerIteration} = jsonLine;
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
  .pipe(process.stdout);
