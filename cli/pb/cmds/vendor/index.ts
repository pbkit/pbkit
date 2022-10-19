import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import directory from "./cmds/directory.ts";
import install from "./cmds/install.ts";

const command = new Command();
command
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("directory", directory)
  .command("install", install);
export default command;
