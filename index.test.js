'use strict';

const cp = require('child_process');
const { expect } = require('chai');

describe('simple-bench', function() {
  this.timeout(10000);

  it('should run a benchmark', function() {
    const options = {
      env: Object.assign({}, process.env, {BENCH: './benchmarks/test-defs.js'})
    };
    const cmd = 'node index.js tinyText split';
    const expected = [
      '[function chain: tinyText, split]',
      '[1000 iterations x 5 groups (500ms intergroup pause)]',
      /\[gc count: \d+, gc time: \d+\.\d+\]/,
      /\[group times: (\d+\.\d+, ){4}\d+\.\d+\]/,
      /\[raw group mean \d+\.\d+ stddev \d+\.\d+ \(\d+\.\d+ per iteration\)\]/,
      {or: new Map([
        [/\[all group times within \d+\.\d+ to \d+\.\d+ \(\d+\.\d+ \+\/- \d \* \d+\.\d+\)\]/, []],
        [
          /\[excluding times outside 63.067 \+\/- \d+\.\d+: \d+\.\d+\]/, [
            /\[clean group mean \d+\.\d+(\d+\.\d+ per iteration) stddev \d+\.\d+\]/
          ]
        ]
      ])},
      /\[mean: \d+\.\d+ per iteration\]/,
    ];

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
      //expect(stderr).to.equal('');
      console.log(stdout);
      checkText(stdout.split('\n'), expected);

    });
  });

});

function checkText(lines, expected) {
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i];
    const l = lines[i];
    if (typeof e === 'string') {
      expect(l).to.equal(e);
    } else if (e instanceof RegExp) {
      expect(l).to.match(e);
    } else if (typeof e === 'object') {
      if (e.or) {
        let found = false;
        for (const [re, subExpected] of e.or) {
          if (re.test(l)) {
            found = true;
            if (subExpected.length > 0) {
              checkText(lines.slice(i), subExpected);
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
