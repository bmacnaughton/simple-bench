# simple-bench

how to use

- create a test-definitions.js file. it should export an object with the key
`tests` and optionally the keys `setup` and `groupSetup`. `tests` value is an
object where each key is a function to be benchmarked.
- run `node index.js key` to run a benchmark function. `key` is one of the keys
in the `tests` object that was exported.
