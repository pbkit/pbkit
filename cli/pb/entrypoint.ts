import {
  Command,
  CompletionsCommand,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import gen from "./cmds/gen/index.ts";
import vendor from "./cmds/vendor/index.ts";

const command = new Command();
command
  .name("pb")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("completions", new CompletionsCommand())
  .command("gen", gen)
  .command("vendor", vendor)
  .command("help", new HelpCommand())
  .parse(Deno.args);
