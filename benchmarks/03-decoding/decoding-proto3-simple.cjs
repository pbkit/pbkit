const path = require('path');
const fs = require('fs');
const { Benchmark } = require('benchmark');

const { build } = require('pbkit/core/schema/builder');
const createLoader = require('pbkit/node/createLoader').default;
const pbkit_Simple = require('../data/gen_js/messages/Simple');

const protobufjs = require('protobufjs');
const protoPath = path.resolve(__dirname, '../data');
const protobufjs_Simple = protobufjs.loadSync(path.join(protoPath, 'simple.proto')).lookupType('Simple');

const bin = fs.readFileSync(path.resolve(__dirname, '../data/simple.bin'));

const noop = () => {};
const test_pbkit = () => JSON.stringify(pbkit_Simple.decodeBinary(bin), null, 2);
const test_protobufjs = () => JSON.stringify(protobufjs_Simple.decode(bin), null, 2);

console.log('pbkit result:', test_pbkit());
console.log('protobufjs result:', test_protobufjs());

return new Benchmark.Suite()
.add('noop', noop)
.add('pbkit decode', test_pbkit)
.add('protobufjs decode', test_protobufjs)
.on('cycle', event => {
  console.log(event.target.toString());
})
.run();
