import {
  Command,
  CompletionsCommand,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";

const command = new Command();
command
  .name("pb")
  .arguments("<command> [options]")
  .command("completions", new CompletionsCommand())
  .command("gen", (await import("./cmds/gen/index.ts")).default)
  .command("help", new HelpCommand().global())
  .parse(Deno.args);
