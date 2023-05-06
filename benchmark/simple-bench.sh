#!/bin/bash

benchmark="./benchmark/benchmarks/$1.js"

case $1 in
    internalize-vs-slice)
        for len in len2 len4 len8 len16 len32 len64; do
            BENCH=$benchmark TERSE=x node benchmark/package/index.js $len slice
            echo ""
            BENCH=$benchmark TERSE=x node benchmark/package/index.js $len distringuish
            echo ""
            echo ""
        done
    ;;

    *)
        if [ -f "$benchmark" ]; then
            echo "benchmark exists but needs to be added to this script"
            exit 1
        else
            echo "usage: $0 <valid benchmark>"
            echo "valid benchmarks:"
            dir -1 ./benchmark/benchmarks | sed 's/^/    /;s/\.js$//'
        fi

    ;;
esac
