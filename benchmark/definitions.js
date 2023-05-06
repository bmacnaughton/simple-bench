'use strict';

module.exports = {
  configure() {
    // this can override the defaults (shown below) in index.js. they are
    // all pretty much what they sound like; see the code for more details.
    return {
      warmupIterations: 100,
      groupIterations: 100000,
      groupCount: 10,
      groupWaitMS: 1000,
      stddevRange: 2,
    };
  },
  // supply the tests. the following are split into data sources and
  // consumers, but the framework knows nothing of that. the intention
  // here is to be able to execute `node index.js giantFileAsText split`
  // and `node index.js giantFileAsTest regex` so that the various tests
  // can be run against different data without a specific test for each
  // combination.
  //
  // there are built-in tests, noop and noopu. noop does nothing other than return
  // its parameter. noopu does not have a parameter and returns undefined. they can
  // be used to evaluate the baseline cost of the test framework or components in a
  // function chain.
  tests: {
    // these are data sources
    bigText() { return this.bigTextData },
    smallText() { return this.smallTextData },
    // these are consumers
    length(data = 'default') {
      // this takes so little time it needs a loop
      for (let i = 1_000_000; i > 0; i--) {
        data.length;
      }
    },
    expand(data = 'default') {
      // this takes a bit longer, so no need to loop
      data.repeat(1000);
    },
    timeTest: async() => new Promise(resolve => setTimeout(resolve, 10)),
  },
  // this is called before executing any tests. if the test needs to do any
  // setup based on the execution params it may do so here.
  setup(config) {
    this.bigTextData = 'a'.repeat(1000);
    this.smallTextData = 'b';

  },
  // this is called before each group (including the warmup) is executed.
  // if a test requires setup for each group (e.g., initializing or clearing
  // an array) it can be done here.
  groupSetup(config) {

  }
};
