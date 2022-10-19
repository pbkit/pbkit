import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { print, println } from "../../misc/stdio.ts";
import {
  getToken,
  GithubNotLoggedInError,
} from "../../../../misc/github/index.ts";

export default new Command()
  .description("Print pollapo login token")
  .action(async () => {
    try {
      const token = await getToken();
      await print(token);
    } catch (err) {
      if (!(err instanceof GithubNotLoggedInError)) throw err;
      await println("You have to login first before get the token.", true);
    }
  });
