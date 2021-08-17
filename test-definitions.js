'use strict';

/* eslint-disable no-unused-vars */

// this has the extension 'js-x' so the tests won't try to run it
const _ = require('lodash');

const DEFAULT_TAG = 'untrusted';

// test definitions
const logger = () => undefined;

class TagRangeV1 {
  /**
   * Validates the arguments to the contructor call.
   * @param {number} start The starting index to track.
   * @param {number} stop  The stopping index to track.
   * @param {string} tag   The name of the tag.
   */
  static validate(start, stop, tag = DEFAULT_TAG) {
    const bothFinite = _.isFinite(start) && _.isFinite(stop);
    if (start > stop || !bothFinite) {
      logger.debug(
        'could not create tag %s with invalid range start: %s, stop %s.',
        tag,
        start,
        stop
      );
    }
  }

  /**
   * @param {number} start The starting index of string tracking on the data having the tag.
   * @param {number} stop  The stopping index of string tracking on the data having the tag.
   * @param {string?} tag  The name of the tag (default is "untrusted").
   */
  constructor(start, stop, tag = DEFAULT_TAG) {
    TagRangeV1.validate(start, stop, tag);
    /** @type {string} */
    this.tag = tag;
    /** @type {number} */
    this.start = start;
    /** @type {number} */
    this.stop = stop;
  }
}

class TagRangeV2 {
  static validate(start, stop, tag) {
    if (!(start <= stop && start >= 0 && stop < Infinity)) {
      logger.debug(
        'could not create tag %s with invalid range start: %s, stop %s.',
        tag,
        start,
        stop
      );
    }
  }
  constructor(start, stop, tag = DEFAULT_TAG) {
    TagRangeV2.validate(start, stop, tag);
    /** @type {string} */
    this.tag = tag;
    /** @type {number} */
    this.start = start;
    /** @type {number} */
    this.stop = stop;
  }
}

class TagRangeV3 {
  constructor(start, stop, tag = DEFAULT_TAG) {
    if (!(start <= stop && start >= 0)) {
      logger.debug(
        'could not create tag %s with invalid range start: %s, stop %s.',
        tag,
        start,
        stop
      );
    }
    /** @type {string} */
    this.tag = tag;
    /** @type {number} */
    this.start = start;
    /** @type {number} */
    this.stop = stop;
  }
}

function v1() {
  for (let i = 0; i < 1000000; i++) {
    new TagRangeV1(0, 11, DEFAULT_TAG);
  }
}

function v2() {
  for (let i = 0; i < 1000000; i++) {
    new TagRangeV2(0, 11, DEFAULT_TAG);
  }
}

function v3() {
  for (let i = 0; i < 1000000; i++) {
    new TagRangeV3(0, 11, DEFAULT_TAG);
  }
}

module.exports = {
  configure() {
    return {
      groupIterations: 10,
      groupWaitMS: 500,
    };
  },
  tests: {
    v1,
    v2,
    v3,
  },
  setup(config) {
  },

};
