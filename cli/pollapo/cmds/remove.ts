import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { stringify } from "https://deno.land/std@0.93.0/encoding/yaml.ts";
import { PollapoNotLoggedInError } from "../misc/github.ts";
import { PollapoUnauthorizedError } from "../misc/github-auth.ts";
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
      const pollapoYmlText = stringify({
        ...pollapoYml,
        deps: targets
          .map(parseOptionalDep)
          .reduce(
            (filteredDeps, targetDep) =>
              filteredDeps.filter((dep) => !isDepMatch(dep, targetDep)),
            pollapoYml?.deps || [],
          )
          .sort(),
      });

      await Deno.writeTextFile(options.config, pollapoYmlText);
    } catch (err) {
      if (
        err instanceof PollapoNotLoggedInError ||
        err instanceof PollapoYmlNotFoundError ||
        err instanceof PollapoUnauthorizedError ||
        err instanceof Error
      ) {
        console.error(err.message);
        return Deno.exit(1);
      }
    }
  });

function isDepMatch(dep: string, targetDep: PollapoOptionalDep) {
  return dep.match(
    new RegExp(
      `^${targetDep.user}/${targetDep.repo}@${targetDep.rev || ".*"}$`,
    ),
  );
}
