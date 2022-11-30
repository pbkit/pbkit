#!/usr/bin/env node
require("core-js/es");
const fs = require("fs");
const mri = require("mri");
const createLoader = require("../createLoader").default;
const expandEntryPaths = require("../expandEntryPaths").default;
const save = require("../save").default;
const { vendorZipPath } = require("../zip-path");
const iterRuntimeFiles = require("../iterRuntimeFiles").default;
const getCodegenModule = require("../codegen.js").default;

run().catch((err) => console.error(err) && process.exit(1));

async function run() {
  const {
    configYaml,
  } = getCliArgs();
  const {
    aot,
    bundle,
    replaceExts,
    yamlTextToBundleConfig,
  } = await getCodegenModule();
  const configYamlText = fs.readFileSync(configYaml, "utf8");
  const { outDir, bundleConfig, extInImport } = await yamlTextToBundleConfig(
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
  );
  await save(
    outDir,
    replaceExts(
      aot({
        modules: bundle(bundleConfig),
        runtimeDir: (
          bundleConfig.runtime?.type === "outDir" &&
          bundleConfig.runtime.outDir
        ) || undefined,
        iterRuntimeFiles,
      }),
      extInImport,
    ),
  );
}

function getCliArgs() {
  const argv = mri(process.argv.slice(2));
  return {
    configYaml: argv._[0] || "",
  };
}
