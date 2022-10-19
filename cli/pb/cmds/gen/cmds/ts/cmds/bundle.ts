import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { createLoader } from "../../../../../../../core/loader/deno-fs.ts";
import save from "../../../../../../../codegen/save.ts";
import {
  bundle,
  yamlTextToBundleConfig,
} from "../../../../../../../codegen/ts/index.ts";
import iterRuntimeFiles from "../../../../../../../codegen/ts/iterRuntimeFiles.ts";
import { getVendorDir } from "../../../../../config.ts";
import expandEntryPaths from "../../../expandEntryPaths.ts";

export default new Command()
  .arguments("<config-yaml:string>")
  .description("Bundle multiple build unit.")
  .action(async (_: void, configYaml: string) => {
    const configYamlText = await Deno.readTextFile(configYaml);
    const [outDir, bundleConfig] = await yamlTextToBundleConfig(
      configYamlText,
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
