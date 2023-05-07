#!/bin/bash

benchmark="./benchmarks/$1.js"

case $1 in
    definitions)
        for text in tinyText bigText; do
            BENCH=$benchmark TERSE=x node index.js $text split
            echo ""
            BENCH=$benchmark TERSE=x node index.js $text regex
            echo ""
            BENCH=$benchmark TERSE=x node index.js $text lastIxString
            echo ""
            echo ""
        done

        for buffer in tinyBuffer bigBuffer; do
            BENCH=$benchmark TERSE=x node index.js $buffer lastIxBuffer
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
            dir -1 ./benchmarks | sed 's/^/    /;s/\.js$//'
        fi

    ;;
esac
