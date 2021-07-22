'use strict';


const _ = require('lodash');
const {Generator} = require('@bmacnaughton/string-generator');
const gen = new Generator().generate;
const TagRange = require('@contrast/agent/lib/assess/models/tag-range');

const ascii_yes = 'bruce-xyzzy-no';
const ascii_no = 'bruce-wendy-no';
const unicode_yes = 'bruce-\u0000\u0000\u0000\u0000\u0000-no';
const unicode_no = 'bruce-wendy-no';

let reAscii;
let reUnicode;
reAscii = new RegExp('xyzzy', 'g');
reUnicode = new RegExp('\\\\u0000\\\\u0000\\\\u0000\\\\u0000\\\\u0000', 'g');

let tagRange;
let trList = [];

function ascii_yesStringify() {
  return JSON.stringify(ascii_yes.repeat(5));
}

function unicode_yesStringify() {
  return JSON.stringify(unicode_yes.repeat(5));
}

function ascii_noStringify() {
  return JSON.stringify(ascii_no.repeat(5));
}

function unicode_noStringify() {
  return JSON.stringify(unicode_no.repeat(5));
}

// one of the above must be run before the following two

function asciiReplace(s) {
  return s.replace(reAscii, (m, offset) => {
    return '';
  });
}
function unicodeReplace(s) {
  return s.replace(reUnicode, (m, offset) => {
    return '';
  });
}

// the following can be run in a chain or standalone
function asciiFound(s) {
  s = s || JSON.stringify(ascii_yes);
  return s.replace(reAscii, (m, offset) => {
    return '';
  });
}

function asciiNotFound(s) {
  s = s || JSON.stringify(ascii_no);
  return s.replace(reAscii, (m, offset) => {
    return '';
  });
}

function unicodeFound(s) {
  s = s || JSON.stringify(unicode_yes);
  return s.replace(reUnicode, (m, offset) => {
    return '';
  });
}

function unicodeNotFound(s) {
  s = s || JSON.stringify(unicode_no);
  return s.replace(reUnicode, (m, offset) => {
    return '';
  });
}







module.exports = {
  tests: {
    trClone() {
      return tagRange.clone();
    },
    _Clone() {
      return _.cloneDeep(tagRange);
    },
    trLoopList() {
      let clone = [];
      for (let i = 0; i < trList.length; i++) {
        clone.push(tagRange.clone());
      }
      return clone;
    },
    trFuncList() {
      return trList.map((r) => r.clone());
    },
    _List() {
      return _.cloneDeep(trList);
    }
  },
  setup ({warmup, groupCount, iterationsPerGroup}) {
    tagRange = new TagRange(1, 100, 'bruce');
    for (let i = 0; i < 2; i++) {
      trList.push(tagRange);
    }
  },

};

if (!module.parent) {
  asciiFound();
  asciiNotFound();
  unicodeFound();
  unicodeNotFound();
}
