# simple-bench

## how to use

- create a test-definitions.js file. it should export an object with the key
`tests`. `tests` value is an object where each key is a function to be benchmarked.
- run `node index.js key` to run a benchmark function. `key` is one of the keys
in the `tests` object that was exported.
- function-chains: if the test functions are structured to take an argument then
multiple functions can be given on the command line and their executions are
chained, e.g., ` node index.js func1 func2`. in this example `func2` will be passed
the return value of `func1`. this enables trying many different combinations without
having to hardcode a function for each.
- the function `noop` is predefined and can be used to evaluate the cost of a function
in a function-chain or of the framework itself.

## test-definitions.js in more detail

```js
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
  // there is a built-in test, noop, that does nothing other than return
  // its parameter. it can used to evaluate the baseline cost of the test
  // framework or components in a function chain.
  tests: {
    // these are data sources
    giantFileAsText,
    giantFileAsBuffer,
    bigFileAsText,
    bigFileAsBuffer,
    tinyFileAsText,
    tinyFileAsBuffer,
    // these are consumers
    split,
    regex,
    lastIxString,
    lastIxBuffer,
  },
  // this is called before executing any tests. if the test needs to do any
  // setup based on the execution params it may do so here.
  setup(config) {

  },
  // this is called before each group (including the warmup) is executed.
  // if a test requires setup for each group (e.g., initializing or clearing
  // an array) it can be done here.
  groupSetup(config) {

  }
};
```

## repo organization

because each benchmark is specific there are no dependencies at this time other
than an eslint dev-dependency.

- `index.js` is the main program.
- `lib/` contains support files.
- `data/` contains any supporting data. there 3 json-format log files there.
- `archived-tests/` contains old test-definition files. many were written for
previous versions and will no longer work.
- `.vscode/launch.json` for debugging in vscode.
- `t.sh` a dumb script for summarizing results.
- `test-definitions.js` the test definitions file read by `index.js`. it must be present.

## more detail

the execution times reported for each group exclude everything other than executing
the function-chain.

```js
perf.mark('start-iteration');
for (let i = groupIterations; i > 0; i--) {
  execute(functionChain);
}
perf.measure('iteration-time', 'start-iteration');
```

the garbage collection counts and times include everything after the requires and
program initialization. it's not clear (to me anyway) how to identify which garbage
collections are associated with the code being benchmarked and which are not. the
best way to get a handle on the baseline garbage collections is to use the `noop`
built-in function as a baseline for comparison.

