'use strict';

const split = require('split');
const through = require('through');

function makeCSV() {
  return through(
    function(data) {
      if (!data.startsWith('{')) {
        this.emit('data', data + '\n');
        return;
      }
      let parsed = JSON.parse(data);
      if (!('big' in parsed) || !('many' in parsed) || !('single' in parsed) || !('other' in parsed)) {
        this.emit('data', data + '\n');
        return;
      }
      // once through to get sizes
      let sizes = [];
      done:
      for (let data in parsed) {
        for (let bench in parsed[data]) {
          for (let size in parsed[data][bench]) {
            sizes.push(size);
          }
          if (sizes.length) {
            break done;
          }
        }
      }
      if (!sizes.length) {
        this.emit('data', 'no sizes found; nothing to format');
        process.exit(1);
      }

      // now create lines
      const lines = [];
      const testNames = {
        big: 'big-array',
        many: 'many-keys',
        single: 'single-key',
        rawParse: 'raw-parse',
        stringify: 'stringify',
      }

      for (let data in parsed) {
        lines.push(testNames[data]);
        lines.push(`≈size,${sizes.join(',')}`);
        for (let bench in parsed[data]) {
          let line = bench;
          let someData = false;
          for (let size of sizes) {
            let value = parsed[data][bench][size];
            if (value === undefined) {
              value = NaN;
            } else {
              someData = true;
            }
            line += `,${value}`;
          }
          if (someData) {
            lines.push(line);
          }
        }
      }
      this.emit('data', lines.join('\n'));
    },
  );
}

module.exports = makeCSV;
