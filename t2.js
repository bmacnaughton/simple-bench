'use strict';


const arr = new Array(10).fill(1);
const n = arr.length;

const newValue = 'xyzzy';

let t;
if (process.argv[2] === 's') {
  t = process.hrtime.bigint();
  for (let i = 0; i < n; i++) {
    const x = arr[i];
  }
  console.log('sequential', process.hrtime.bigint() - t);
} else if (process.argv[2] === 'f') {
  t = process.hrtime.bigint();
  for (const val of arr) {
    const x = val;
  }
  console.log('for-of', process.hrtime.bigint() - t);
} else {
  t = process.hrtime.bigint();
  arr.forEach((val) => {
    const x = val;
  });
  console.log('for-each', process.hrtime.bigint() - t);
}

/**
sequenti 2115700n
for-of   6267900n
for-each 1593800n
 */
