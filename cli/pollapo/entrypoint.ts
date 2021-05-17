import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";

const command = new Command();
command
  .name("pollapo")
  .arguments("<command> [options]")
  .action(() => command.showHelp())
  .command("login", (await import("./cmds/login.ts")).default)
  .command("add", (await import("./cmds/add.ts")).default)
  .command("remove", (await import("./cmds/remove.ts")).default)
  .command("install", (await import("./cmds/install.ts")).default)
  .command("why", (await import("./cmds/why.ts")).default)
  .parse(Deno.args);
