import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { Confirm } from "https://deno.land/x/cliffy@v0.19.5/prompt/confirm.ts";
import {
  pollToken,
  requestCode,
  writeGhHosts,
} from "../../../../misc/github/auth.ts";
import { print, println } from "../../misc/stdio.ts";
import { open } from "../../../../misc/browser.ts";
import { bold, yellow } from "https://deno.land/std@0.147.0/fmt/colors.ts";
import {
  getToken,
  GithubNotLoggedInError,
} from "../../../../misc/github/index.ts";
import token from "./token.ts";

export default new Command()
  .description("Sign in with GitHub account")
  .action(async () => {
    await println(`${bold("Pollapo login")}`);
    await println("");
    try {
      await getToken();
      const confirmed = await Confirm.prompt(
        {
          message:
            "You're already logged into github.com. Do you want to re-authenticate?",
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
    const code = await requestCode();
    await println(
      `${yellow("!")} First copy your one-time code: ${bold(code.userCode)}`,
    );
    await print(
      `- ${bold("Press Enter")} to open github.com in your browser... `,
    );
    await Deno.stdin.read(new Uint8Array(1));
    const { success } = await open(code.verificationUri);
    if (!success) {
      await println(
        "Failed opening a browser. Please try entering the URL in your browser manually.",
      );
      await println(code.verificationUri);
    }
    const pollTokenResult = await pollToken(code);
    await writeGhHosts(pollTokenResult.accessToken);
    await println("You are all set!");
  })
  .command("token", token);
