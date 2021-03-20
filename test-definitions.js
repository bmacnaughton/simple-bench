'use strict';

// this has the extension 'js-x' so the tests won't try to run it
const TagRange = require('../agent/lib/assess/models/tag-range');
// load tag range utilities v1 (existing) and v2 (proposed).
const truV1 = require('../agent/lib/assess/models/tag-range/util-x.js');
const truV2 = require('../agent/lib/assess/models/tag-range/util.js');

const str = 'space laser gun';
const pewpew = 'pew pew';
const zoink = 'zoink';

const pewpew0toLength = new TagRange(0, str.length, pewpew);
const pewpew0to1 = new TagRange(0, 1, pewpew);
const pewpew3to4 = new TagRange(3, 4, pewpew);
const pewpew5to5 = new TagRange(5, 5, pewpew);
const pewpew6to7 = new TagRange(6, 7, pewpew);
const pewpew0to5 = new TagRange(0, 5, pewpew);
const pewpew5to10 = new TagRange(5, 10, pewpew);
const pewpew6to10 = new TagRange(6, 10, pewpew);
const zoink0toLength = new TagRange(0, str.length - 1, zoink);
const zoink6to10 = new TagRange(6, 10, zoink);

// test definitions

const v1 = {
  signature: 'value',
  isOfType() {
    return truV1.isOfType('pew pew', pewpew0to1);
  },
  isNotOfType() {
    return truV1.isNotOfType('pew pew', pewpew0to1);
  },
  addOneTag(list = []) {
    return truV1.add(list, pewpew0to1);
  },
  addTwoTags(list = []) {
    list = truV1.add(list, pewpew3to4);
    return truV1.add(list, pewpew5to5);
  },
  addThreeTags(list = []) {
    list = truV1.add(list, pewpew3to4);
    list = truV1.add(list, pewpew5to5);
    return truV1.add(list, pewpew6to7);
  },
  removeOneTag(list = []) {
    return truV1.remove(list, pewpew0to1.tag);
  }
};
v1.default = v1.addSingleRange;

const v2 = {
  signature: 'reference',
  isOfType () {
    return truV2.isOfType('pew pew', pewpew0to1);
  },
  isNotOfType () {
    return truV2.isNotOfType('pew pew', pewpew0to1);
  },
  addOneTag(list = []) {
    truV2.addInPlace(list, pewpew0to1);
    return list;
  },
  addTwoTags(list = []) {
    truV2.addInPlace(list, pewpew3to4);
    truV2.addInPlace(list, pewpew5to5);
  },
  addThreeTags(list = []) {
    truV2.addInPlace(list, pewpew3to4);
    truV2.addInPlace(list, pewpew5to5);
    truV2.addInPlace(list, pewpew6to7);
  },
  removeOneTag(list = []) {
    if (list.length === 0) {
      return;
    }
    truV2.remove(list, list[0].tag);
  }
};
v2.default = v2.addSingleRange;

const abbreviations = {
  iot: 'isOfType',
  inot: 'isNotOfType',
  a1t: 'addOneTag',
  a2t: 'addTwoTags',
  a3t: 'addThreeTags',
  r1t: 'removeOneTag',
};

module.exports = {v1, v2, abbreviations};
