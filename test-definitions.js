'use strict';


const _ = require('lodash');
const {Generator} = require('@bmacnaughton/string-generator');
const gen = new Generator().generate;

const data = [];
let i = 0;
const obj = {
  agent: {
    node: {
      api: {
        bruce: {
          wenxin: {
            grace: 'data'
          }
        }
      }
    }
  }
};

function inline() {
  return typeof data[i++] === 'string' || data[i] instanceof String;
}
function t_instanceof() {
  return data[i++] instanceof String;
}

function t_typeof() {
  return typeof data[i++] === 'string';
}

function lodash() {
  return _.isString(data[i++]);
}

function _get() {
  return _.get(obj, 'agent.node.api.bruce.wenxin');
}

function get() {
  return obj.agent && obj.agent.node && obj.agent.node.api &&
    obj.agent.node.api.bruce && obj.agent.node.api.bruce.wenxin;
  //return obj.agent.node.api.bruce.wenxin;
}

function _getF() {
  return _.get(obj, 'agent.node.fail.bruce.wenxin');
}

function getF() {
  return obj.agent && obj.agent.node && obj.agent.node.fail &&
    obj.agent.node.fail.bruce && obj.agent.node.fail.bruce.wenxin;
}

module.exports = {
  tests: {
    inline,
    lodash,
    t_instanceof,
    t_typeof,
    get,
    _get,
    getF,
    _getF
  },
  setup ({warmup, groupCount, iterationsPerGroup}) {
    for (let i = 0; i < iterationsPerGroup; i++) {
      if (i & 0) {
        data[i] = new String(gen('${[a-z]<2,4>}'));
      } else {
        data[i] = gen('${[a-z]<2,4>}');
      }
    }
  },
  groupSetup(iterations) {
    i = 0;
  }
};
