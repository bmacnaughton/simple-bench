#!/bin/bash

echo "baseline"
node index.js -m noop noop

echo "tinyFilename stream"
node index.js -m tinyFilename streamProcessFile
echo "bigFilename stream"
node index.js -m bigFilename streamProcessFile
echo "giantFilename stream"
node index.js -m giantFilename streamProcessFile
echo "ginormous stream"
node index.js -m ginormous streamProcessFile

echo "tinyFilename read"
node index.js -m tinyFilename readProcessFile
echo "bigFilename read"
node index.js -m bigFilename readProcessFile
echo "giantFilename read"
node index.js -m giantFilename readProcessFile
echo "ginormous read"
node index.js -m ginormous readProcessFile

