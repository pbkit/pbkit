import {
  Command,
  CompletionsCommand,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";

const command = new Command();
command
  .name("pb")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("completions", new CompletionsCommand())
  .command("decode", (await import("./cmds/decode/index.ts")).default)
  .command("devtools", (await import("./cmds/devtools/index.ts")).default)
  .command("gen", (await import("./cmds/gen/index.ts")).default)
  .command("lsp", (await import("./cmds/lsp/index.ts")).default)
  .command("vendor", (await import("./cmds/vendor/index.ts")).default)
  .command("help", new HelpCommand())
  .parse(Deno.args);
