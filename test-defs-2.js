'use strict';

'use strict';

const TagRange = require('../agent/lib/assess/models/tag-range');

// load tag range utilities v1 (existing) and v2 (proposed).
const V1 = require('../agent/lib/assess/models/tag-range/util-x.js');
const V2 = require('../agent/lib/assess/models/tag-range/util.js');

//           123456789*12345
const str = 'space laser gun';
const pewpew = 'pew-pew';
const zoink = 'zoink';

const pewpew0toLength = new TagRange(0, str.length - 1, pewpew);
const pewpew0to1 = new TagRange(0, 1, pewpew);
const pewpew3to4 = new TagRange(3, 4, pewpew);
const pewpew5to5 = new TagRange(5, 5, pewpew);
const pewpew6to7 = new TagRange(6, 7, pewpew);
const pewpew0to5 = new TagRange(0, 5, pewpew);
const pewpew5to10 = new TagRange(5, 10, pewpew);
const pewpew6to10 = new TagRange(6, 10, pewpew);
const zoink0toLength = new TagRange(0, str.length - 1, zoink);
const zoink3to5 = new TagRange(3, 5, zoink);
const zoink6to10 = new TagRange(6, 10, zoink);
const zoink7to9 = new TagRange(7, 9, zoink);
const zoink11to14 = new TagRange(11, 14, zoink);

module.exports = {
  validate,
  make
};

// test definitions
const testFunctions = {
  noop: {
    nonList: true,
    v1: () => null,
    v2: () => null,
  },
  isOfType: {
    nonList: true,
    v1: () => V1.isOfType('pew-pew', pewpew0to1),
    v2: () => V2.isOfType('pew-pew', pewpew0to1),
  },
  isNotOfType: {
    nonList: true,
    v1: () => V1.isNotOfType('pew pew', pewpew0to1),
    v2: () => V2.isNotOfType('pew pew', pewpew0to1),
  },
  addOneTag: {
    v1(list) {
      return V1.add(list, pewpew0to1);
    },
    v2(list) {
      V2.addInPlace(list, pewpew0to1);
    },
  },
  addTwoTags: {
    v1(list) {
      list = V1.add(list, pewpew0to1);
      return V1.add(list, pewpew3to4);
    },
    v2(list) {
      V2.addInPlace(list, pewpew0to1);
      V2.addInPlace(list, pewpew3to4);
    }
  },
  addThreeTags: {
    v1(list) {
      list = V1.add(list, pewpew0to1);
      list = V1.add(list, pewpew3to4);
      return V1.add(list, pewpew6to7);
    },
    v2(list) {
      V2.addInPlace(list, pewpew0to1);
      V2.addInPlace(list, pewpew3to4);
      V2.addInPlace(list, pewpew6to7);
    }
  },
  removeOneTag: {
    v1(list) {
      return V1.remove(list, pewpew0to1.tag);
    },
    v2(list) {
      V2.removeInPlace(list, pewpew0to1.tag);
    },
  },
  addAllZoinks: {
    v1(list) {
      return V1.addAll(list, [zoink3to5, zoink7to9, zoink11to14]);
    },
    v2(list) {
      return V2.addAllInPlace(list, [zoink3to5, zoink7to9, zoink11to14]);
    }

  }

}

const abbreviations = {
  iot: 'isOfType',
  inot: 'isNotOfType',
  a1t: 'addOneTag',
  a2t: 'addTwoTags',
  a3t: 'addThreeTags',
  r1t: 'removeOneTag',
};

const versions = {v1: true, v2: true};

function validate({version, args: tests, options}) {
  if (!versions[version]) {
    return {ok: false, message: `invalid version ${version}`};
  }
  const validFunctions = [];
  const invalidFunctions = [];
  for (let i = 0; i < tests.length; i++) {
    const fn = testFunctions[tests[i]] || testFunctions[abbreviations[tests[i]]];
    if (!fn) {
      invalidFunctions.push(tests[i]);
      continue;
    }
    if (fn.nonList) {
      fn[version].nonList = true;
    }
    validFunctions.push(fn[version]);
  }
  if (invalidFunctions.length) {
    return {ok: false, message: `invalid functions: ${invalidFunctions.join(', ')}`};
  }
  return {ok: true, validFunctions, version};
}

function make({ok, validFunctions, version}) {
  if (!ok) {
    throw new Error('ok property must be true');
  }
  if (version === 'v1') {
    return function () {
      let list = [];
      for (let i = 0; i < validFunctions.length; i++) {
        if (validFunctions[i].nonList) {
          validFunctions[i]();
        } else {
          list = validFunctions[i](list);
        }
      }
    }
  } else {
    return function () {
      const list = [];
      for (let i = 0; i < validFunctions.length; i++) {
        if (validFunctions[i].nonList) {
          validFunctions[i]();
        } else {
          validFunctions[i](list);
        }
      }
    }
  }

}


