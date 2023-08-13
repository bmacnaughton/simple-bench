'use strict';

const fs = require('fs');

const p = import('@bmacnaughton/string-generator');
p.then(({default: Generator}) => {
  const g = new Generator();
  const array = [];

  for (let i = 0; i < 5; i++) {
    array.push(g.decode('[A-Za-z_$]') + g.decode('[A-Za-z_$0-9]<1:20>'));
  }

  fs.writeFileSync('string-array.json', JSON.stringify(array));
});


