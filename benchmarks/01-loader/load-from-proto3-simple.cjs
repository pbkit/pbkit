// Note:
//   This compares pbkit with protobuf.js for the all necessary steps for codegen.
//   It's may not fair comparison because the two are different, but both commonly involve reading files, parsing, and transform into the internal representation.
//
//   This inclues IO intensive part

const path = require('path');
const { Benchmark } = require('benchmark');

const { build } = require('pbkit/core/schema/builder');
const createLoader = require('pbkit/node/createLoader').default;

const protobufjs = require('protobufjs');

const protoPath = path.resolve(__dirname, '../data');

function createPbkitLoader() {
  const roots = [protoPath];
  const loader = createLoader({ roots });
  return {
    load: filePath => build({ loader, files: [filePath] }),
  };
}
const pbkitLoader = createPbkitLoader();

const noop = () => {};
const pbkitTest = () => pbkitLoader.load('simple.proto');
const protobufjsTest = () => protobufjs.load(path.join(protoPath, 'simple.proto'));

async function run() {
  console.log('pbkit result:', await pbkitTest());
  console.log('protobufjs result:', await protobufjsTest());

  return new Benchmark.Suite()
  .add('noop', noop)
  .add('pbkit load schema', {
    defer: true,
    fn: async deferred => {
      await pbkitTest();
      deferred.resolve();
    },
  })
  .add('protobufjs load descriptor', {
    defer: true,
    fn: async deferred => {
      await protobufjsTest();
      deferred.resolve();
    },
  })
  .on('cycle', event => {
    console.log(event.target.toString());
  })
  .run({ async: true });
}

run();
