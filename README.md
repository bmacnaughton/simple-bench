# simple-bench

simple-bench is a toolkit for executing JavaScript benchmarks; it is not a
product that makes everything super-simple.

simple-bench handles basic benchmarking tasks
- warmup
- multiple runs
- removing statistical outliers
- collecting timing and garbage-collection data
- reporting as text or JSON

While it is an npm package, it's not particularly convenient to install it
as a dependency. Keep reading.

## how to use - a recipe

- create a directory for building your benchmark (or make a subdirectory in an existing
project).
- fetch the simple-bench package from npm using `npm pack @bmacnaughton/simple-bench`
- using `benchmarks/definitions.js` as an example, create your own benchmarks/definitions.js
file. it should export an object with the key `tests`. `tests` value is an object where
each key is a function to be benchmarked.
- run `node index.js key` to run a benchmark function. `key` is one of the keys
in the `tests` object that was exported.
- function-chains: if the test functions are structured to take an argument then
multiple functions can be given on the command line and their executions are
chained, e.g., `node index.js func1 func2`. in this example `func2` will be passed
the return value of `func1`. this enables trying many different combinations without
having to hardcode a function for each.
- the function chain allows async functions; you can also just return a promise but it
will get an async wrapper (async function detection uses the constructor name).
- the function `noop` is predefined and can be used to evaluate the cost of a function
in a function-chain or of the framework itself.
- if the work done by the function is very small relative to the work done by simple-bench,
then it may be necessary to loop within the test function to offset simple-bench's base
level overhead.

## options

Command line options:
- -d debug - additional details written to stdout
- -m capture memory usage stats too (not typically useful)

Environment variable options:
- BENCH - use this value for benchmark file (default is benchmark/definitions.js)
- JSON - set to any non-empty value - output as JSON, not text
- TERSE - set to any non-empty value - minimal text output (ignored if JSON specified)


## benchmark/definitions.js in more detail

See the example benchmark in `benchmarks/definitions.js`. The goal of the benchmark
is to compare different ways of splitting a log file into individual lines.

Key points:
- data initialization is done as part of module loading. This minimizes any impact
on the benchmark.
- there are four sources, a giant file and a tiny file, each available as a string
and as a buffer.
- there are three consumers for the string representation and one for the buffer
representation.
- `simple-bench.sh` is hand-coded to run each desired combination of source and
consumer.

Typical output of `simple-bench.sh` is:

```bash
$ ./simple-bench.sh definitions
[function chain: tinyText, split]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 986, gc time: 77.888]
[group clean mean 85.779 raw stddev 5.479]
[mean: 0.0008578 per iteration]

[function chain: tinyText, regex]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 1061, gc time: 83.476]
[group clean mean 148.547 raw stddev 3.462]
[mean: 0.001485 per iteration]

[function chain: tinyText, lastIxString]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 969, gc time: 74.153]
[group clean mean 60.552 raw stddev 3.701]
[mean: 0.0006055 per iteration]


[function chain: bigText, split]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 5859, gc time: 444.208]
[group clean mean 607.719 raw stddev 30.326]
[mean: 0.006077 per iteration]

[function chain: bigText, regex]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 3426, gc time: 511.623]
[group clean mean 2281.062 raw stddev 60.194]
[mean: 0.02281 per iteration]

[function chain: bigText, lastIxString]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 5342, gc time: 399.592]
[group clean mean 478.940 raw stddev 28.984]
[mean: 0.004789 per iteration]


[function chain: tinyBuffer, lastIxBuffer]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 986, gc time: 73.766]
[group clean mean 118.157 raw stddev 3.669]
[mean: 0.001182 per iteration]


[function chain: bigBuffer, lastIxBuffer]
[100000 iterations x 10 groups (1000ms intergroup pause)]
[gc count: 5034, gc time: 479.090]
[group clean mean 1932.526 raw stddev 10.916]
[mean: 0.01933 per iteration]
```

From the output, it can be seen that the `lastIxString` approach is fastest.

## more detail

Execution times reported for each group exclude everything other than executing
the function-chain. The code:

```js
async function test() {
  // call the tester's setup
  if (definitions.setup) {
    await (async() => definitions.setup(config))();
  }
  if (groupSetup) {
    await (async() => groupSetup(config))();
  }
  // warmup
  for (let i = warmupIterations; i > 0; i--) {
    await execute(functionChain);
  }
  await pause(groupWaitMS);

  // execute x groups of y iterations with a pause after each group
  for (let i = 0; i < groupCount; i++) {
    // setup for the group
    if (groupSetup) {
      await (async() => groupSetup(config))();
    }
    perf.mark('start-iteration');
    for (let i = groupIterations; i > 0; i--) {
      await execute(functionChain);
    }
    perf.measure('iteration-time', 'start-iteration');
    if (memCheck) {
      memory[i] = process.memoryUsage();
    }
    await pause(groupWaitMS);
  }

  // final pause
  await pause(groupWaitMS * 10);
  return pause(groupWaitMS);
}

//
// execute functionChains
//
async function execute(fc) {
  let lastResult = undefined;
  for (let i = 0; i < fc.length; i++) {
    lastResult = await fc[i](lastResult);
  }
}
```

the garbage collection counts and times include everything after the requires and
program initialization. it's not clear (to me anyway) how to identify which garbage
collections are associated with the code being benchmarked and which are not. the
best way to get a handle on the baseline garbage collections is to use the `noop`
built-in function as a baseline for comparison.

## todo

- update make-csv, pipe-extract, and pipe-make-csv
- flesh out testing: verify stats, different stddev ranges, ...
- TERSE
- release scripts
