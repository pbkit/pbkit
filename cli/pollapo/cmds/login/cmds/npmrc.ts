import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { Confirm } from "https://deno.land/x/cliffy@v0.25.2/prompt/confirm.ts";
import Npmrc from "npm:@npmcli/config@8.0.3";
import npmrc from "npm:@npmcli/config@8.0.3/lib/definitions/index.js";
import { println } from "../../../misc/stdio.ts";
import { writeGhHosts } from "../../../../../misc/github/auth.ts";
import {
  getToken,
  GithubNotLoggedInError,
} from "../../../../../misc/github/index.ts";

export default new Command()
  .description("Sign in with .npmrc config")
  .option("-S, --silent", "Prevents interactive cli functionality")
  .action(async ({ silent }) => {
    if (!silent) {
      try {
        await getToken();
        const confirmed = await Confirm.prompt(
          {
            message:
              "You're already logged into github.com. Do you want to override?",
            default: false,
            indent: "",
          },
        );
        if (!confirmed) return;
      } catch (err) {
        if (!(err instanceof GithubNotLoggedInError)) {
          throw err;
        }
      }
    }
    const { definitions, flatten, shorthands } = npmrc;
    const config = new Npmrc({
      npmPath: "",
      definitions,
      shorthands,
      flatten,
      argv: [],
    });
    await config.load();
    const { token } = config.getCredentialsByURI("https://npm.pkg.github.com");
    if (!token) {
      if (!silent) await println("No github credentials found in npmrc.");
      return Deno.exit(1);
    } else {
      await writeGhHosts(token);
    }
  });
