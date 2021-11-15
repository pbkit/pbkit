const path = require('path');
const fs = require('fs');
const { Benchmark } = require('benchmark');

const pbkitParser = require('pbkit/core/parser/proto');
const protobufjs = require('protobufjs');

const proto = fs.readFileSync(path.resolve(__dirname, '../data/file-descriptor.proto'), 'utf-8');

const noop = () => {}
const test_pbkit = () => pbkitParser.parse(proto);
const test_protobufjs = () => protobufjs.parse(proto, { keepCase: true });

console.log('pbkit result:', test_pbkit());
console.log('protobufjs result:', test_protobufjs());

new Benchmark.Suite()
.add('noop', noop)
.add('pbkit parse', test_pbkit)
.add('protobufjs parse', test_protobufjs)
.on('cycle', event => {
  console.log(event.target.toString());
})
.run();
