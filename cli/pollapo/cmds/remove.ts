import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { stringify } from "https://deno.land/std@0.93.0/encoding/yaml.ts";
import {
  loadPollapoYml,
  parseOptionalDep,
  PollapoOptionalDep,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";

interface Options {
  token?: string;
  config: string;
}

export default new Command()
  .arguments("<targets...:string>")
  .description("Remove dependencies.")
  .option("-C, --config <value:string>", "Pollapo config", {
    default: "pollapo.yml",
  })
  .action(async (options: Options, targets: string[]) => {
    try {
      const pollapoYml = await loadPollapoYml(options.config);
      const targetDeps = targets.map(parseOptionalDep);
      const pollapoYmlText = stringify({
        ...pollapoYml,
        deps: pollapoYml?.deps
          ?.filter((dep) => {
            for (const { user, repo, rev } of targetDeps) {
              const pattern = new RegExp(`^${user}/${repo}@${rev || ".*"}$`);
              if (dep.match(pattern)) return false;
            }
            return true;
          })
          .sort(),
      });

      await Deno.writeTextFile(options.config, pollapoYmlText);
    } catch (err) {
      if (err instanceof PollapoYmlNotFoundError) {
        console.error(err.message);
        return Deno.exit(1);
      }
    }
  });
