import {
  Command,
  CompletionsCommand,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";

const command = new Command();
command
  .name("pollapo")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .option("-v, --version", "Show way to check version", {
    standalone: true,
    action: () => {
      console.log(`HOW TO CHECK POLLAPO VERSION

Pre-built binary: NOT SUPPORTED
Homebrew: brew info pbkit
Windows: Settings > Apps > Apps & Features, find pollapo`);
    },
  })
  .command("add", (await import("./cmds/add.ts")).default)
  .command("completions", new CompletionsCommand())
  .command("help", new HelpCommand())
  .command("install", (await import("./cmds/install.ts")).default)
  .command("login", (await import("./cmds/login/index.ts")).default)
  .command("remove", (await import("./cmds/remove.ts")).default)
  .command("why", (await import("./cmds/why.ts")).default)
  .parse(Deno.args);
