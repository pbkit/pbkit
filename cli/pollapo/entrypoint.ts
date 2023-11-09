import {
  Command,
  CompletionsCommand,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import add from "./cmds/add.ts";
import install from "./cmds/install.ts";
import login from "./cmds/login/index.ts";
import remove from "./cmds/remove.ts";
import why from "./cmds/why.ts";

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
  .command("add", add)
  .command("completions", new CompletionsCommand())
  .command("help", new HelpCommand())
  .command("install", install)
  .command("login", login)
  .command("remove", remove)
  .command("why", why)
  .parse(Deno.args);
