import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { stringify } from "https://deno.land/std@0.147.0/encoding/yaml.ts";
import {
  loadPollapoYml,
  parseDepFrag,
  PollapoYml,
  PollapoYmlNotFoundError,
  sanitizeDeps,
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
      const pollapoYmlText = stringify(sanitizeDeps(
        filterDeps(pollapoYml, targets),
      ) as Record<string, unknown>);
      await Deno.writeTextFile(options.config, pollapoYmlText);
    } catch (err) {
      if (err instanceof PollapoYmlNotFoundError) {
        console.error(err.message);
        return Deno.exit(1);
      }
    }
  });

function filterDeps(pollapoYml: PollapoYml, targets: string[]): PollapoYml {
  const targetDeps = targets.map(parseDepFrag);
  return {
    ...pollapoYml,
    deps: pollapoYml?.deps
      ?.filter((dep) => {
        for (const { user, repo, rev } of targetDeps) {
          const pattern = new RegExp(`^${user}/${repo}@${rev || ".*"}$`);
          if (dep.match(pattern)) return false;
        }
        return true;
      }),
  };
}
