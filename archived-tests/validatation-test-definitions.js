'use strict';

//
// this file exports self-contained tests
//
const {isISIN, isISIN2, x} = require('./isISIN2');

const valid = [
  'AU0000XVGZA3',
  'DE000BAY0017',
  'BE0003796134',
  'SG1G55870362',
  'GB0001411924',
  'DE000WCH8881',
  'PLLWBGD00016',
  'US0378331005',
];
const invalid = [
  'DE000BAY0018',
  'PLLWBGD00019',
  'foo',
  '5398228707871528',
];

const perf_hooks = require('perf_hooks');
/* eslint-disable no-unused-vars */
const {perf, PerformanceObserver: PerfObserver} = perf_hooks;

function execute(fn) {
  for (let i = 0; i < valid.length; i++) {
    if (!fn(valid[i])) {
      throw new Error(valid[i], 'returned invalid');
    }
  }
  for (let i = 0; i < invalid.length; i++) {
    if (fn(invalid[i])) {
      throw new Error(valid[i], 'returned valid');
    }
  }
}

function v1() {
  execute(x);
}
function v2() {
  execute(isISIN);
}
function v3() {
  execute(isISIN2);
}

module.exports = {v1, v2, v3};
