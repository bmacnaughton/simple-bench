'use strict';

const fs = require('fs');

const {Generator} = require('@bmacnaughton/string-generator');
const g = new Generator();

const array = [];

for (let i = 0; i < 1000000; i++) {
  array.push(g.gen('${[A-Za-z_$]}${[A-Za-z_$0-9]<1,20>}'));
}

fs.writeFileSync('string-array.json', JSON.stringify(array));
