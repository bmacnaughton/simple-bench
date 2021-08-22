#!/bin/bash

ver=$(node -v)
ver=${ver:1:2}

cp ~/github/csi/distringuish/index.js \
    ./node_modules/@contrast/distringuish-prebuilt/

cp ~/github/csi/distringuish/build/Release/distringuish.node \
    "./node_modules/@contrast/distringuish-prebuilt/linux-$ver"/




