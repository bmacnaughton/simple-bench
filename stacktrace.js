'use strict';

const Callsite = (module.exports.Callsite = generateCallsites(
  new Error()
)[0].constructor);

let stack = {};
class MyError extends Error {
  constructor(message) {
    super(`my bad error ${message}`);
    this.code = 'my-bad-error';
    this.stack = {};
    Error.captureStackTrace(stack, MyError);
  }
  callFn(fn, ...rest) {
    return fn(...rest);
  }
}

//let me = new MyError('oops');
//console.log(me);

let callsites;

if (true) {

  function x() {
    y();
  }

  function y() {
    const me = new MyError('funnythin');
    me.callFn(z);
    //z();
  }

  function z() {
    const prep = Error.prepareStackTrace;
    const trace = {};
    Error.captureStackTrace(trace, z);
    Error.prepareStackTrace = function(_, _callsites) {
      callsites = _callsites;
      return _callsites;
    };
    trace.stack;
    Error.prepareStackTrace = prep;
  }

  x();

  for (const site of callsites) {
    if (!(site instanceof Callsite)) {
      continue
    }
    console.log(site.getFunctionName(), site.getTypeName());
  }
}

function generateCallsites(error) {
  let callsites;

  const {prepareStackTrace} = Error;

  Error.prepareStackTrace = function(_, _callsites) {
    callsites = _callsites;
    return _callsites;
  };

  // accessing the getter will call `Error.prepareStacktrace`
  error.stack;

  // restore original method
  Error.prepareStackTrace = prepareStackTrace;

  return callsites;
}
