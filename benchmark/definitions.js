'use strict';

const { Stash, hasData, setData, getData, delData } = require('../../../csi/stash');

// duplicate of Stash using ForApi() calls
class StashOla {
  constructor(string) {
    this.key = string;
  }
  hasData(obj) {
    return hasData(obj, this.key);
  }
  setData(obj, value) {
    return setData(obj, this.key, value);
  }
  getData(obj) {
    return getData(obj, this.key);
  }
  delData(obj) {
    return delData(obj, this.key);
  }
}

const stash = new Stash('stasholeum');
const stashola = new StashOla('stasholeum');

function setup(config) {}

module.exports = {
  configure() {
    return {
      // warmupIterations: 100,
      warmupIterations: 1000,
      // groupCount: 10,
      groupCount: 50,
      // groupIterations: 100000,
      groupIterations: 100000,
      // groupWaitMS: 1000,
      groupWaitMS: 250,
    };
  },
  setup,
  groupSetup(config) {
  },
  tests: {
    '1000'() {
      return 1000;
    },
    '100'() {
      return 100;
    },
    stashOla(n) {
      for (let i = 0; i < n; i++) {
        const obj = { attack: 'killer tomatoes' };
        stashola.setData(obj, { tracked: true });
      }
    },
    stash(n) {
      for (let i = 0; i < n; i++) {
        const obj = { attack: 'killer tomatoes' };
        stash.setData(obj, { tracked: true });
      }
    },
  },
  final() {
    // eslint-disable-next-line no-console
    //console.log('tracked', trackedCount, 'untracked', untrackedCount);
  }
};
