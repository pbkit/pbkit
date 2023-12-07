import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";

const command = new Command();
command
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("directory", (await import("./cmds/directory.ts")).default)
  .command("install", (await import("./cmds/install.ts")).default);
export default command;
