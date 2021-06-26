import { red } from "https://deno.land/std@0.98.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.98.0/fs/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";
import { println } from "../misc/stdio.ts";
import {
  loadPollapoYml,
  PollapoYmlMalformedError,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";
import { Confirm } from "https://deno.land/x/cliffy@v0.18.0/prompt/confirm.ts";

interface Options {
  config: string;
}

export default new Command()
  .description("Clean dependency directory.")
  .option("-C, --config <value:string>", "Pollapo config", {
    default: "pollapo.yml",
  })
  .action(async (options: Options) => {
    try {
      const pollapoYml = await loadPollapoYml(options.config);
      if (pollapoYml?.outDir) {
        if (existsSync(pollapoYml.outDir)) {
          const confirmed = await Confirm.prompt(
            `Delete ${path.resolve(pollapoYml.outDir)}?`,
          );
          if (confirmed) {
            await Deno.remove(pollapoYml.outDir, { recursive: true });
          }
        } else {
          throw new OutDirNotFoundError(pollapoYml.outDir);
        }
      }
    } catch (err) {
      if (
        err instanceof PollapoYmlMalformedError ||
        err instanceof PollapoYmlNotFoundError ||
        err instanceof OutDirNotFoundError
      ) {
        console.error(err.message);
        return Deno.exit(1);
      }
      throw err;
    }
  });

class OutDirNotFoundError extends Error {
  constructor(public outDir: string) {
    super(`outDir "${red(path.resolve(outDir))}" not exists`);
  }
}
