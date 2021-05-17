import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { PollapoNotLoggedInError } from "../misc/github.ts";
import { PollapoUnauthorizedError } from "../misc/github-auth.ts";
import { PollapoYmlNotFoundError } from "../pollapoYml.ts";

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
      // Remove dependencies...
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
