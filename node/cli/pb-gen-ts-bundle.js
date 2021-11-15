#!/usr/bin/env node
require("core-js/es");
const fs = require("fs");
const mri = require("mri");
const createLoader = require("../createLoader").default;
const expandEntryPaths = require("../expandEntryPaths").default;
const save = require("../save").default;
const { vendorZipPath } = require("../zip-path");
const iterRuntimeFiles = require("../iterRuntimeFiles").default;

run().catch((err) => console.error(err) && process.exit(1));

async function run() {
  const {
    configYaml,
  } = getCliArgs();
  const { bundle, yamlTextToBundleConfig } = await getBundle();
  const configYamlText = fs.readFileSync(configYaml, "utf8");
  const [outDir, bundleConfig] = await yamlTextToBundleConfig(
    configYamlText,
    async (protoPaths, entryPaths, protoFiles) => {
      const roots = [
        ...entryPaths,
        ...protoPaths,
        process.cwd(),
        vendorZipPath,
      ];
      return {
        loader: createLoader({ roots }),
        files: [...await expandEntryPaths(entryPaths), ...protoFiles],
      };
    },
    iterRuntimeFiles,
  );
  await save(outDir, bundle(bundleConfig));
}

async function getBundle() {
  const modulePath = "../../codegen/ts/index.mjs";
  const module = await import(modulePath);
  const { bundle, yamlTextToBundleConfig } = module;
  return { bundle, yamlTextToBundleConfig };
}

function getCliArgs() {
  const argv = mri(process.argv.slice(2));
  return {
    configYaml: argv._[0] || "",
  };
}
