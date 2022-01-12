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

// Note: They are compatible at the only binary level. The JSON payload may be different.
const pbkit_data = pbkit_Simple.decodeBinary(bin);
const protobufjs_data = protobufjs_Simple.decode(bin);

const noop = () => {};
const test_pbkit = () => pbkit_Simple.encodeBinary(pbkit_data);
const test_protobufjs = () => protobufjs_Simple.encode(protobufjs_data).finish();

console.log('pbkit_input:', JSON.stringify(pbkit_data, null, 2));
console.log('pbkit result:', test_pbkit());
console.log('protobufjs_input:', JSON.stringify(protobufjs_data, null, 2));
console.log('protobufjs result:', Uint8Array.from(test_protobufjs()));

new Benchmark.Suite()
.add('noop', noop)
.add('pbkit encode', test_pbkit)
.add('protobufjs encode', test_protobufjs)
.on('cycle', event => {
  console.log(event.target.toString());
})
.run();
