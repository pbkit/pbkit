import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import raw from "./cmds/raw.ts";

const command = new Command();
command
  .description(
    "Read a binary message of the given type from standard input and write it in text format to standard output.",
  )
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("raw", raw);
export default command;
