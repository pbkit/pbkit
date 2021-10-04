#!/usr/bin/env node

const mri = require("mri");
const createLoader = require("../createLoader").default;
const expandEntryPaths = require("../expandEntryPaths").default;
const save = require("../save").default;
const { vendorZipPath } = require("../zip-path");
const { build } = require("../../core/schema/builder");
const iterRuntimeFiles = require("../iterRuntimeFiles").default;

run().catch((err) => console.error(err) && process.exit(1));

async function run() {
  const {
    entryPaths,
    protoPaths,
    protoFiles,
    outDir,
    extInImport,
  } = getCliArgs();
  const gen = await getGen();
  const roots = [...entryPaths, ...protoPaths, process.cwd(), vendorZipPath];
  const loader = createLoader({ roots });
  const files = [
    ...await expandEntryPaths(entryPaths),
    ...protoFiles,
  ];
  const schema = await build({ loader, files });
  await save(outDir, gen(schema, { extInImport, iterRuntimeFiles }));
}

async function getGen() {
  const module = "../../codegen/ts/index.mjs";
  return (await import(module)).default;
}

function getCliArgs() {
  const argv = mri(process.argv.slice(2), {
    alias: { "out-dir": "o" },
    string: ["entry-path", "proto-path", "out-dir", "ext-in-import"],
    default: {
      "out-dir": "out",
      "ext-in-import": "",
    },
  });
  const wraparr = (value) => (
    value == null ? [] : Array.isArray(value) ? value : [value]
  );
  return {
    entryPaths: wraparr(argv["entry-path"]),
    protoPaths: wraparr(argv["proto-path"]),
    protoFiles: wraparr(argv._),
    outDir: argv["out-dir"],
    extInImport: argv["ext-in-import"],
  };
}
