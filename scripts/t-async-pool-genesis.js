'use strict';

let n = 0;

const random = () => Math.floor(Math.random() * 1000);

async function main() {
  let active = 0;
  let total = 0;
  let promises = Array(10);
  let freeslots = [...promises.keys()];

  for (let i = 0; i < 10; i++) {
    const slot = freeslots.splice(0, 1)[0];
    promises[slot] = new Promise(resolve => {
      setTimeout(() => {
        console.log('resolving', slot, freeslots.length, promises.length);
        delete promises[slot];
        freeslots.push(slot);
        resolve(slot);
      }, random());
    });
  }

  const t1 = await Promise.race(promises);
  console.log('t1', t1);

  await Promise.all(promises);

  console.log('freeslots', freeslots);
  console.log('promises', promises);
}

function fn() {
  return new Promise(resolve => setTimeout(() => resolve('fn'), random()))
}

function makeSimulPool(n) {
  const promises = Array(n);
  const freeslots = [...promises.keys()];
  // execute fn
  async function xq(fn) {
    if (!freeslots.length) {
      await Promise.race(promises);
      console.log('waited for available slot', freeslots[0]);
    }
    const slot = freeslots.splice(0, 1)[0];
    promises[slot] = fn()
      .then(r => {
        console.log('resolving', slot, freeslots.length, promises.length);
        delete promises[slot];
        freeslots.push(slot);
        return r;
      });
  }
  xq.promises = promises;
  xq.freeslots = freeslots;
  xq.done = async () => Promise.all(promises);
  return xq;
}

async function main101() {
  let total = 0;

  const xq = makeSimulPool(5);

  while (total < 20) {
    await xq(fn);
    total += 1;
  }
  await xq.done();
  console.log(xq.promises, xq.freeslots);
}

async function main2() {
  let active = 0;
  let total = 0;
  let promises = Array(10);
  let freeslots = [...promises.keys()];

  while (total < 20) {
    if (!freeslots.length) {
      const slot = await Promise.race(promises);
      console.log('waited for available slot', slot);
    }
    const slot = freeslots.splice(0, 1)[0];
    promises[slot] = new Promise(resolve => {
      setTimeout(() => {
        console.log('resolving', slot, freeslots.length, promises.length);
        delete promises[slot];
        freeslots.push(slot);
        resolve(slot);
      }, random());
    });
    total += 1;
  }

  const t1 = await Promise.race(promises);
  console.log('t1', t1);

  await Promise.all(promises);

  console.log('freeslots', freeslots);
  console.log('promises', promises);
}

main101()
 .then(() => null);
