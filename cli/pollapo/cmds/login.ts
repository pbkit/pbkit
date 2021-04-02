import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { Confirm } from "https://deno.land/x/cliffy@v0.18.0/prompt/confirm.ts";
import { pollToken, requestCode } from "../misc/github-auth.ts";
import { print, println } from "../misc/stdio.ts";
import { open } from "https://deno.land/x/opener/mod.ts";
import { bold, yellow } from "https://deno.land/std@0.91.0/fmt/colors.ts";
import { readGhHosts } from "../misc/github.ts";

export default new Command()
  .description("Github Login")
  .action(async () => {
    await println(`${bold("Pollapo login")}`);
    await println("");

    const ghHosts = await readGhHosts();
    if (ghHosts["github.com"].oauth_token) {
      const confirmed = await Confirm.prompt(
        {
          message:
            "You're already logged into github.com. Do you want to re-authenticate?",
          default: false,
          indent: "",
        },
      );

      if (!confirmed) return;
    }

    const code = await requestCode();
    await println(
      `${yellow("!")} First copy your one-time code: ${bold(code.userCode)}`,
    );
    await print(
      `- ${bold("Press Enter")} to open github.com in your browser... `,
    );
    const _ = await Deno.stdin.read(new Uint8Array(1));
    try {
      await open(code.verificationUri);
      await pollToken(code);
    } catch {
      await println(
        "Failed opening a browser. Please try entering the URL in your browser manually.",
      );
      await println(code.verificationUri);
    }
  });
