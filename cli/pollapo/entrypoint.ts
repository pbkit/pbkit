import { Command } from "https://deno.land/x/cliffy@v0.17.2/command/mod.ts";

const command = new Command();
command
  .name("pollapo")
  .arguments("<command> [options]")
  .action(() => command.showHelp())
  .command("install", (await import("./cmds/install.ts")).default)
  .parse(Deno.args);
