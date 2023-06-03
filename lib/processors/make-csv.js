'use strict';

const output = {"big": {"jsTraverse": {}, "scoreBody": {}, "rustTraverse": {}, "rawParse": {}, "stringify": {}}, "many": {"jsTraverse": {}, "scoreBody": {}, "rustTraverse": {}, "rawParse": {}, "stringify": {}}, "single": {"jsTraverse": {}, "scoreBody": {}, "rustTraverse": {}, "rawParse": {}, "stringify": {}}, "other": {"jsTraverse": {"3": 0.04444155440330506, "4": 0.04252417358160019, "5": 0.0430982128739357, "6": 0.04432391818761825, "7": 0.04632126070261002, "8": 0.04926414059400558, "9": 0.05082578740119934, "10": 0.05182872721883986, "11": 0.053820705665482416}, "scoreBody": {"3": 0.04947993367248111, "4": 0.05062020999193192, "5": 0.0479890644788742, "6": 0.047258361220359806, "7": 0.04871734091043472, "8": 0.049345427989959716, "9": 0.051784108197689055, "10": 0.05078823165098826, "11": 0.050007014089160494}, "rustTraverse": {"3": 0.039167289710044864, "4": 0.039054958379268645, "5": 0.03804267796278, "6": 0.03956300368309021, "7": 0.03924531852006912, "8": 0.04234206142425537, "9": 0.04224460228681564, "10": 0.043774708127975466, "11": 0.04334599061012268}, "rawParse": {"3": 0.015358876597881316, "4": 0.01488392219543457, "5": 0.015904522800445558, "6": 0.016484737825393676, "7": 0.016121656310558317, "8": 0.015193915104866028, "9": 0.015458020687103271, "10": 0.016022656595706942, "11": 0.01498072702884674}, "stringify": {"3": 0.010456758916378022, "4": 0.012062486374378205, "5": 0.011126994609832764, "6": 0.012592546606063843, "7": 0.012203995382785797, "8": 0.012383069801330568, "9": 0.011893786597251892, "10": 0.012802852725982666, "11": 0.00823002474837833}}};

// once through to get sizes
let sizes = [];
done:
for (let data in output) {
  for (let bench in output[data]) {
    for (let size in output[data][bench]) {
      sizes.push(size);
    }
    if (sizes.length) {
      break done;
    }
  }
}

if (!sizes.length) {
  console.log('no sizes found; nothing to format');
  process.exit(1);
}

// now create lines

const lines = [];
const testNames = {
  big: 'big-array',
  many: 'many-keys',
  single: 'single-key',
  rawParse: 'raw-parse',
  stringify: 'stringify',
}

for (let data in output) {
  lines.push(testNames[data]);
  lines.push(`≈size,${sizes.join(',')}`);
  for (let bench in output[data]) {
    let line = bench;
    let someData = false;
    for (let size of sizes) {
      let value = output[data][bench][size];
      if (value === undefined) {
        value = NaN;
      } else {
        someData = true;
      }
      line += `,${value}`;
    }
    if (someData) {
      lines.push(line);
    }
  }
}
console.log(lines.join('\n'));
