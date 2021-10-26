import { parse as parseYaml } from "https://deno.land/std@0.107.0/encoding/yaml.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { createLoader } from "../../../../../../../core/loader/deno-fs.ts";
import save from "../../../../../../../codegen/save.ts";
import {
  bundle,
  BundleConfigYaml,
  yamlToBundleConfig,
} from "../../../../../../../codegen/ts/index.ts";
import iterRuntimeFiles from "../../../../../../../codegen/ts/iterRuntimeFiles.ts";
import { getVendorDir } from "../../../../../config.ts";
import expandEntryPaths from "../../../expandEntryPaths.ts";

interface Options {}

export default new Command()
  .arguments("<config-yaml:string>")
  .description("Bundle multiple build unit.")
  .action(async (_: Options, configYaml: string) => {
    const configYamlText = await Deno.readTextFile(configYaml);
    const yaml = parseYaml(configYamlText) as BundleConfigYaml;
    const outDir = yaml["out-dir"] ?? "out";
    const bundleConfig = await yamlToBundleConfig(
      yaml,
      async (protoPaths, entryPaths, protoFiles) => {
        const roots = [
          ...entryPaths,
          ...protoPaths,
          Deno.cwd(),
          getVendorDir(),
        ];
        return {
          loader: createLoader({ roots }),
          files: [...await expandEntryPaths(entryPaths), ...protoFiles],
        };
      },
      iterRuntimeFiles,
    );
    await save(outDir, bundle(bundleConfig));
  });
