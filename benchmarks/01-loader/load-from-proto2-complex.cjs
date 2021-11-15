// Note:
//   This compares pbkit with protobuf.js for the all necessary steps for codegen.
//   It's may not fair comparison because the two are different, but both commonly involve reading files, parsing, and transform into the internal representation.
//
//   This inclues IO intensive part

const path = require('path');
const { Benchmark } = require('benchmark');

const { build } = require('pbkit/core/schema/builder');
const createLoader = require('pbkit/node/createLoader').default;
const { vendorZipPath } = require('pbkit/node/zip-path');

const protobufjs = require('protobufjs');

const protoPath = path.resolve(__dirname, '../data');

function createPbkitLoader() {
  const roots = [protoPath, vendorZipPath];
  const loader = createLoader({ roots });
  return {
    load: filePath => build({ loader, files: [filePath] }),
  };
}
const pbkitLoader = createPbkitLoader();

const noop = () => {};
const test_pbkit = () => pbkitLoader.load('file-descriptor.proto');
const test_protobufjs = () => protobufjs.load(path.join(protoPath, 'file-descriptor.proto'));

async function run() {
  console.log('pbkit result:', await test_pbkit());
  console.log('protobufjs result:', await test_protobufjs());

  return new Benchmark.Suite()
  .add('noop', noop)
  .add('pbkit load from file', {
    defer: true,
    fn: async deferred => {
      await test_pbkit();
      deferred.resolve();
    },
  })
  .add('protobufjs load from file', {
    defer: true,
    fn: async deferred => {
      await test_protobufjs();
      deferred.resolve();
    },
  })
  .on('cycle', event => {
    console.log(event.target.toString());
  })
  .run({ async: true });
}

run();
