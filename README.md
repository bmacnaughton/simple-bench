# simple-bench

how to use

- create a test-definitions.js file. it should export an object with the key
`tests` and optionally the keys `setup` and `groupSetup`. `tests` value is an
object where each key is a function to be benchmarked.
- run `node index.js key` to run a benchmark function. `key` is one of the keys
in the `tests` object that was exported.
- if the test functions are structured to take an argument then multiple functions
can be given on the command line and their executions are chained, e.g.,
` node index.js func1 func2`. in this example `func2` will be passed the return value
of `func1`. this enables trying many different combinations without having to hardcode
a function for each.
