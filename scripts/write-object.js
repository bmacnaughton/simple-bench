'use strict';

const fs = require('fs');

const p = import('@bmacnaughton/string-generator');

p.then(({default: Generator}) => {
  execute(new Generator());
});


function execute(g) {
  const nums = process.argv.slice(2).map(arg => arg - 0);
  nums.forEach(num => {
    if (isNaN(num) || num < 0) {
      /* eslint-disable no-console */
      console.error('arguments must be: keys min max valueMin valueMax');
      console.error('  all but keys are optional (min=10, max=25, valueMin=20, valueMax=200)');
      /* eslint-enable no-console */
      throw new Error(`invalid argument: ${num}`);
    }
  });

  const [keys, min = 10, max = 25, valueMin = 20, valueMax = 200] = nums;

  const keyFirst = '[A-Za-z_$]';
  const keyGen = `[A-Za-z_$0-9-]<${min - 1}:${max - 1}>`;
  const valueGen = `[ -~]<${valueMin}:${valueMax}>`;

  const object = {};

  for (let i = 0; i < keys; i++) {
    const key = `${g.decode(keyFirst)}${g.decode(keyGen)}`;
    object[key] = g.decode(valueGen);
  }

  const filename = `object-${keys}-${min}-${max}-${valueMin}-${valueMax}.json`;
  fs.writeFileSync(filename, JSON.stringify(object));

}
