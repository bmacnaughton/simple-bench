#!/bin/bash

# script to run the sequence of simple-bench scenarios.
#
# it's intended to uncover where the costs are.
#
# see benchmarks/definitions.js for the details on each setting but
# here is a summary:
#
# a benchmark consists of multiple functions that are executed. the functions
# are defined in benchmark/definitions.js. all but the last function are typically
# used set parameters for the last function (this makes it easy to run multiple
# configurations)
#
# configuration functions
#
# noCheck - does not run the `input_analysis::check_input()` function
# noCheckWithFinding - same but generates a finding that is passed back to node
# check (the default) - executes `input_analysis::check_input()`
#
# short - uses "input" as the string to check. minimal agent-lib logic is executed.
# long - uses a 76 character cmd-injection attack string.
# (short and long don't apply to the collection benchmark, included in the
# kitcheSink benchmark - see below)
#
# benchmark functions
#
# stubScoreAtom - stub napi function, returns the count of arguments passed
# eachRuleType - executes scoreAtom() with the input for each rule
# allRuleTypes - executes scoreAtom() with all rules set in the mask
# eachInputType - executes scoreAtom() with the input for each input type
# collection - executes 5 different rules, each with a "real" attack input
# kitchenSink - executes eachRuleType, allRuleTypes, eachInputType, and collection
#

# stubScoreAtom() measures the cost of just calling agent-lib without interpreting
# any arguments or returning complex data (just a number). so call it once with
# a 5 character string and once with a 76 character string.
node index short stubScoreAtom
node index long stubScoreAtom

# eachRuleType() measures the cost of making a call to check_input() for each of the
# 10 rules. when called with "short", it never gets past the upfront screening. when
# called with "long", it does in many cases. the difference between short and long
# approximates the cost of actually executing the regex/keyword logic.

node index short noCheck eachRuleType
node index long noCheck eachRuleType

node index short noCheckWithFinding eachRuleType
node index long noCheckWithFinding eachRuleType

node index short check eachRuleType
node index long check eachRuleType

# collection() measures the cost of "real" attacks for 4 rules. it ignores "short"
# and "long" because it has a specific input for each rule.

node index noCheck collection
node index noCheckWithFinding collection
node index check collection
