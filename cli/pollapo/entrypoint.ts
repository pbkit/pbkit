import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";

const command = new Command();
command
  .name("pollapo")
  .arguments("<command> [options]")
  .command("add", (await import("./cmds/add.ts")).default)
  .command("install", (await import("./cmds/install.ts")).default)
  .command("clean", (await import("./cmds/clean.ts")).default)
  .command("login", (await import("./cmds/login.ts")).default)
  .command("remove", (await import("./cmds/remove.ts")).default)
  .command("why", (await import("./cmds/why.ts")).default)
  .parse(Deno.args);
