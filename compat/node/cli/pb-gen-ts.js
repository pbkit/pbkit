#!/usr/bin/env node
require("core-js/es");
const mri = require("mri");
const createLoader = require("../createLoader").default;
const expandEntryPaths = require("../expandEntryPaths").default;
const save = require("../save").default;
const { vendorZipPath } = require("../zip-path");
const { build } = require("../../../core/schema/builder");
const iterRuntimeFiles = require("../iterRuntimeFiles").default;
const getCodegenModule = require("../codegen.js").default;

run().catch((err) => console.error(err) && process.exit(1));

async function run() {
  const {
    entryPaths,
    protoPaths,
    protoFiles,
    runtimeDir,
    runtimePackage,
    messagesDir,
    servicesDir,
    outDir,
    indexFilename,
    extInImport,
  } = getCliArgs();
  const {
    default: gen,
    aot,
    replaceExts,
  } = await getCodegenModule();
  const roots = [...entryPaths, ...protoPaths, process.cwd(), vendorZipPath];
  const loader = createLoader({ roots });
  const files = [
    ...await expandEntryPaths(entryPaths),
    ...protoFiles,
  ];
  const schema = await build({ loader, files });
  const genConfig = {
    indexFilename,
    runtime: runtimePackage
      ? { type: "packageName", packageName: runtimePackage.trim() }
      : { type: "outDir", outDir: runtimeDir.trim() },
    messages: { outDir: messagesDir.trim() },
    services: { outDir: servicesDir.trim() },
  };
  await save(
    outDir,
    replaceExts(
      aot({
        modules: gen(schema, genConfig),
        runtimeDir: (
          genConfig.runtime?.type === "outDir" &&
          genConfig.runtime.outDir
        ) || undefined,
        iterRuntimeFiles,
      }),
      extInImport,
    ),
  );
}

function getCliArgs() {
  const argv = mri(process.argv.slice(2), {
    alias: { "out-dir": "o" },
    string: [
      "entry-path",
      "proto-path",
      "out-dir",
      "index-filename",
      "ext-in-import",
    ],
    default: {
      "runtime-dir": "runtime",
      "messages-dir": "messages",
      "services-dir": "services",
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
    runtimeDir: argv["runtime-dir"],
    runtimePackage: argv["runtime-package"],
    messagesDir: argv["messages-dir"],
    servicesDir: argv["services-dir"],
    outDir: argv["out-dir"],
    indexFilename: argv["index-filename"],
    extInImport: argv["ext-in-import"],
  };
}
