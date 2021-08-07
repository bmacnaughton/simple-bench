#!/bin/bash

echo "baseline"
node index.js noop noop

echo "giantFileAsText lastIxString"
node index.js giantFileAsText lastIxString

echo "giantFileAsText split"
node index.js giantFileAsText split

echo "giantFileAsText regex"
node index.js giantFileAsText regex

echo "giantFileAsBuffer lastIxBuffer"
node index.js giantFileAsBuffer lastIxBuffer
