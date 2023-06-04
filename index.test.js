'use strict';

const cp = require('child_process');
const { expect } = require('chai');

describe('simple-bench', function() {
  this.timeout(10000);

  describe('checkText() verification', function() {
    it('should pass when all results in stddev range', function() {
      const lines = [
        '[function chain: tinyText, split]',
        '[1000 iterations x 5 groups (500ms intergroup pause) stddevRange 2]',
        '[gc count: 14, gc time: 5.246]',
        '[group times: 5.46, 3.15, 4.52, 5.40, 4.84]',
        '[raw group mean 4.673 stddev 0.840 (0.005 per iteration)]',
        '[all group times within 2.99 to 6.35 (4.673 +/- 2 * 0.840)]',
        '[mean: 0.004673 per iteration]',
        '',
      ];
      const options = { groupIterations: 1000, groupCount: 5, groupWaitMS: 500 };

      checkText(lines, makeExpectedPatterns(options));
    });

    it('should pass when some results are outliers', function() {
      const lines = [
        '[function chain: tinyText, split]',
        '[1000 iterations x 5 groups (500ms intergroup pause) stddevRange 2]',
        '[gc count: 969, gc time: 77.905]',
        '[group times: 68.19, 64.92, 63.26, 61.92, 62.97]',
        '[raw group mean 63.067 stddev 3.191 (0.001 per iteration)]',
        '[excluding times outside 63.067 +/- 6.38: 55.97]',
        '  [clean group mean 63.856 (0.001 per iteration) stddev 2.257]',
        '[mean: 0.0006386 per iteration]',
        '',
      ];

      const options = { groupIterations: 1000, groupCount: 5, groupWaitMS: 500 };

      checkText(lines, makeExpectedPatterns(options));
    });
  });

  describe('checkJson() verification', function() {
    it('should pass when all results in stddev range', function() {
      const expected = {
        functionChain: ['tinyText', 'split'],
        warmupIterations: 100,
        groupIterations: 1000,
        groupCount: 5,
        groupWaitMS: 500,
        stddevRange: 2,
      };
      const lines = [
        '{"functionChain":["tinyText","split"],"groupIterations":1000,"groupCount":5,"groupWaitMS":500}',
        '{"params":{"functionChain":["tinyText","split"],"warmupIterations":100,"groupIterations":1000,"groupCount":5,"groupWaitMS":500,"stddevRange":2},"runSettings":{"memory":false,"debug":false,"verify":false,"terse":true,"verbose":false,"json":true,"perFunctionTiming":true,"functionNames":["noop","noopu"]},"gc":{"count":14,"time":5.740867376327515},"raw":{"times":[5.811535120010376,5.786210060119629,4.669967889785767,3.7147247791290283,4.580817937850952],"mean":4.91265115737915,"meanPerIteration":0.00491265115737915,"stddev":0.7968856375280545},"clean":{"times":[5.811535120010376,5.786210060119629,4.669967889785767,3.7147247791290283,4.580817937850952],"lowRange":3.318879882323041,"highRange":6.506422432435259,"mean":4.91265115737915,"meanPerIteration":0.00491265115737915,"stddev":0.7968856375280545},"outliers":{"times":[]}}',
      ];
      checkJson(lines, expected);
    });

    it('should pass when some results are outliers', function() {
      const expected = {
        functionChain: ['len16', 'slice'],
        warmupIterations: 1000,
        groupIterations: 100000,
        groupCount: 50,
        groupWaitMS: 250,
        stddevRange: 2,
      };
      const lines = [
        '{"functionChain":["len16","slice"],"groupIterations":100000,"groupCount":50,"groupWaitMS":250}',
        '{"params":{"functionChain":["len16","slice"],"warmupIterations":1000,"groupIterations":100000,"groupCount":50,"groupWaitMS":250,"stddevRange":2},"runSettings":{"memory":false,"debug":false,"verify":false,"terse":true,"verbose":false,"json":true,"perFunctionTiming":true,"functionNames":["noop","noopu"]},"gc":{"count":4569,"time":772.6553266048431},"raw":{"times":[653.7040169239044,651.7025010585785,638.6328239440918,654.9300050735474,651.6340808868408,658.859965801239,648.5415329933167,645.297847032547,672.6187858581543,654.0263068675995,655.7054059505463,644.9835760593414,661.6226758956909,650.7214198112488,645.4922919273376,652.6162369251251,656.0952751636505,643.5701990127563,638.0188000202179,652.7671718597412,657.4829180240631,653.3609688282013,653.7425320148468,659.2686219215393,659.7574980258942,800.1209869384766,653.0243089199066,661.4125978946686,666.2974829673767,660.2911930084229,657.6552109718323,671.8578600883484,680.2656099796295,674.1516110897064,682.9227321147919,654.2500970363617,839.5100090503693,726.4677729606628,652.6196010112762,662.0503990650177,654.0396001338959,665.2921438217163,661.2565960884094,656.6870331764221,659.9419617652893,657.5471138954163,670.6064178943634,661.5361471176147,666.1760909557343,657.1920812129974],"mean":665.3665223407745,"meanPerIteration":0.006653665223407745,"stddev":34.42564880277417},"clean":{"times":[653.7040169239044,651.7025010585785,638.6328239440918,654.9300050735474,651.6340808868408,658.859965801239,648.5415329933167,645.297847032547,672.6187858581543,654.0263068675995,655.7054059505463,644.9835760593414,661.6226758956909,650.7214198112488,645.4922919273376,652.6162369251251,656.0952751636505,643.5701990127563,638.0188000202179,652.7671718597412,657.4829180240631,653.3609688282013,653.7425320148468,659.2686219215393,659.7574980258942,653.0243089199066,661.4125978946686,666.2974829673767,660.2911930084229,657.6552109718323,671.8578600883484,680.2656099796295,674.1516110897064,682.9227321147919,654.2500970363617,726.4677729606628,652.6196010112762,662.0503990650177,654.0396001338959,665.2921438217163,661.2565960884094,656.6870331764221,659.9419617652893,657.5471138954163,670.6064178943634,661.5361471176147,666.1760909557343,657.1920812129974],"lowRange":596.5152247352262,"highRange":734.2178199463228,"mean":658.9311483552059,"meanPerIteration":0.006589311483552059,"stddev":13.527496105287105},"outliers":{"times":[800.1209869384766,839.5100090503693]}}',
      ];

      checkJson(lines, expected);
    });
  });

  describe('basic benchmarks', function() {
    it('should run a benchmark with text output', function() {
      const options = {
        env: Object.assign({}, process.env, {BENCH: './benchmarks/test-defs.js'})
      };
      const cmd = 'node index.js tinyText split';

      const p = new Promise((resolve, reject) => {
        cp.exec(cmd, options, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({stdout, stderr});
          }
        });
      });

      return p.then(({stdout, stderr}) => {
        if (stderr) {
          // eslint-disable-next-line no-console
          console.log('STDERR:', stderr);
        }
        checkText(stdout.split('\n'), makeExpectedPatterns());
      });
    });

    it('should run a benchmark with json output', function() {
      const expected = {
        functionChain: ['tinyText', 'split'],
        warmupIterations: 10,
        groupIterations: 100,
        groupCount: 5,
        groupWaitMS: 100,
        stddevRange: 2,
      };
      const options = {
        env: Object.assign({}, process.env, {
          BENCH: './benchmarks/test-defs.js',
          JSON: true,
        })
      };
      const cmd = 'node index.js tinyText split';

      const p = new Promise((resolve, reject) => {
        cp.exec(cmd, options, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      return p.then(({ stdout, stderr }) => {
        if (stderr) {
          // eslint-disable-next-line no-console
          console.log('STDERR:', stderr);
        }
        checkJson(stdout.split('\n'), expected);
      });

    });
  });

  describe('env vars should override benchmark settings', function() {
    it('for text output', function() {
      const envOverrides = {
        WARMUP_ITERATIONS: 2,
        GROUP_ITERATIONS: 5,
        GROUP_COUNT: 3,
        GROUP_WAIT_MS: 50,
        STDDEV_RANGE: 1.5,
      };
      // now convert to expected form
      const overrides = {};
      for (const k of Object.keys(envOverrides)) {
        overrides[envToProperty(k)] = envOverrides[k];
      }
      const options = {
        env: Object.assign({}, process.env, {
          BENCH: './benchmarks/test-defs.js',
        }, envOverrides)
      };
      const cmd = 'node index.js tinyText split';

      const p = new Promise((resolve, reject) => {
        cp.exec(cmd, options, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      return p.then(({ stdout, stderr }) => {
        if (stderr) {
          // eslint-disable-next-line no-console
          console.log('STDERR:', stderr);
        }
        checkText(stdout.split('\n'), makeExpectedPatterns(overrides));
      });
    });

    it('for json output', function() {
      const expected = {
        functionChain: ['tinyText', 'split'],
        warmupIterations: 2,
        groupIterations: 5,
        groupCount: 3,
        groupWaitMS: 50,
        stddevRange: 1.5,
      };
      const options = {
        env: Object.assign({}, process.env, {
          BENCH: './benchmarks/test-defs.js',
          JSON: true,
          WARMUP_ITERATIONS: expected.warmupIterations,
          GROUP_ITERATIONS: expected.groupIterations,
          GROUP_COUNT: expected.groupCount,
          GROUP_WAIT_MS: expected.groupWaitMS,
          STDDEV_RANGE: expected.stddevRange,
        })
      };

      const cmd = 'node index.js tinyText split';

      const p = new Promise((resolve, reject) => {
        cp.exec(cmd, options, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      return p.then(({ stdout, stderr }) => {
        if (stderr) {
          // eslint-disable-next-line no-console
          console.log('STDERR:', stderr);
        }
        checkJson(stdout.split('\n'), expected);
      });

    });
  });

  describe('per-function-times', function() {
    it.skip('should run a benchmark with text output', function() {
      const options = {
        env: Object.assign({}, process.env, {BENCH: './benchmarks/test-defs.js'})
      };
      const cmd = 'node index.js tinyText split';

      const p = new Promise((resolve, reject) => {
        cp.exec(cmd, options, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({stdout, stderr});
          }
        });
      });

      return p.then(({stdout, stderr}) => {
        if (stderr) {
          // eslint-disable-next-line no-console
          console.log('STDERR:', stderr);
        }
        checkText(stdout.split('\n'), makeExpectedPatterns());
      });
    });

    it('should run a benchmark with json output', function() {
      const expected = {
        functionChain: ['tinyText', 'split'],
        warmupIterations: 10,
        groupIterations: 100,
        groupCount: 5,
        groupWaitMS: 100,
        stddevRange: 2,
      };
      const options = {
        env: Object.assign({}, process.env, {
          BENCH: './benchmarks/test-defs.js',
          JSON: true,
          PER_FUNCTION_TIMES: true,
        }),
      };
      const cmd = 'node index.js tinyText split';

      const p = new Promise((resolve, reject) => {
        cp.exec(cmd, options, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      return p.then(({ stdout, stderr }) => {
        if (stderr) {
          // eslint-disable-next-line no-console
          console.log('STDERR:', stderr);
        }
        checkJson(stdout.split('\n'), expected);
      });

    });
  });
});

// used for testing text output
function makeExpectedPatterns(options) {
  const defaultOptions = {
    functionChain: ['tinyText', 'split'],
    groupIterations: 100,
    groupCount: 5,
    groupWaitMS: 100,
    stddevRange: 2,
  };
  const {
    functionChain,
    groupIterations: groupIt,
    groupCount,
    groupWaitMS: groupWait,
    stddevRange,
  } = Object.assign({}, defaultOptions, options);


  return [
    `[function chain: ${functionChain.join(', ')}]`,
    `[${groupIt} iterations x ${groupCount} groups (${groupWait}ms intergroup pause) stddevRange ${stddevRange}]`,
    /\[gc count: \d+, gc time: \d+\.\d+\]/,
    ///\[group times: (\d+\.\d+, ){4}\d+\.\d+\]/,
    new RegExp(`\\[group times: (\\d+\\.\\d+, ){${groupCount - 1}}\\d+\\.\\d+\\]`),
    /\[raw group mean \d+\.\d+ stddev \d+\.\d+ \(\d+\.\d+ per iteration\)\]/,
    {
      or: new Map([
        // this will only match integer stddevs or stddevs with one decimal place
        //                                                               v
        [/\[all group times within \d+\.\d+ to \d+\.\d+ \(\d+\.\d+ \+\/- \d(\.\d)? \* \d+\.\d+\)\]/, []],
        [/\[excluding times outside 63.067 \+\/- \d+\.\d+: \d+\.\d+\]/, [
          /\[clean group mean \d+\.\d+ \(\d+\.\d+ per iteration\) stddev \d+\.\d+\]/
        ]]
      ])
    },
    /\[mean: \d+\.\d+ per iteration\]/,
  ];
}

// this check needs to handle results both with and without outliers.
// that's the reason for the or clause in the expected data.
function checkText(lines, expected) {
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i];
    const l = lines[i];
    if (typeof e === 'string') {
      expect(l).equal(e);
    } else if (e instanceof RegExp) {
      expect(l).to.match(e);
    } else if (typeof e === 'object') {
      if (e.or) {
        let found = false;
        for (const [re, subExpected] of e.or) {
          if (re.test(l)) {
            found = true;
            if (subExpected.length > 0) {
              checkText(lines.slice(i + 1), subExpected);
              i += subExpected.length;
            }
            break;
          }
        }
        expect(found).equal(true, `no match found for ${l}`);
      } else {
        throw new Error('unknown object type');
      }

    } else {
      throw new Error('unknown type');
    }
  }
}

// this check implicitly handles results with outliers because the code can
// use the outliers.times array to adjust the expected length of the clean
// times array.
function checkJson(lines, expected) {
  const o1 = JSON.parse(lines[0]);
  expect(o1).keys(['functionChain', 'groupIterations', 'groupCount', 'groupWaitMS']);
  expect(o1.functionChain).eql(expected.functionChain);
  expect(o1.groupIterations).equal(expected.groupIterations);
  expect(o1.groupCount).equal(expected.groupCount);
  expect(o1.groupWaitMS).equal(expected.groupWaitMS);

  const o2 = JSON.parse(lines[1]);
  expect(o2).keys(['params', 'gc', 'raw', 'clean', 'outliers', 'runSettings']);
  expect(o2.params).an('object').keys([
    'functionChain',
    'warmupIterations',
    'groupIterations',
    'groupCount',
    'groupWaitMS',
    'stddevRange',
  ]);
  expect(o2.params.functionChain).eql(o1.functionChain);
  expect(o2.params.warmupIterations).equal(expected.warmupIterations);
  expect(o2.params.groupIterations).equal(o1.groupIterations);
  expect(o2.params.groupCount).equal(o1.groupCount);
  expect(o2.params.groupWaitMS).equal(o1.groupWaitMS);
  expect(o2.params.stddevRange).equal(expected.stddevRange);

  expect(o2.gc).an('object').keys(['count', 'time']);
  expect(o2.gc.count).a('number');
  expect(o2.gc.time).a('number');

  expect(o2.raw.times).an('array').length(o1.groupCount);
  expect(o2.outliers.times).an('array');
  expect(o2.clean.times).an('array').length(o1.groupCount - o2.outliers.times.length);

  o2.raw.times.every(t => expect(t).a('number'));
  o2.clean.times.every(t => expect(t).a('number'));
  o2.outliers.times.every(t => expect(t).a('number'));

  expect(o2.raw.mean).a('number');
  expect(o2.raw.meanPerIteration).a('number');
  expect(o2.raw.stddev).a('number');

  expect(o2.clean.lowRange).a('number');
  expect(o2.clean.highRange).a('number');
  expect(o2.clean.mean).a('number');
  expect(o2.clean.meanPerIteration).a('number');
  expect(o2.clean.stddev).a('number');
}

function envToProperty(name) {
  let lc = name.toLowerCase();
  lc = lc.replace(/([a-z])_([a-z])/g, (m, p1, p2) => `${p1}${p2.toUpperCase()}`);
  if (lc === 'groupWaitMs') {
    lc = 'groupWaitMS';
  }
  return lc;
}
