import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { run } from "../../../../language-server/server.ts";

const command = new Command();
command
  .description("Execute language server.")
  .option(
    "--stdio",
    "Option for language-server client",
    { hidden: true },
  )
  .option(
    "--clientProcessId <pid: number>",
    "Option for language-server client",
    { hidden: true },
  )
  .action(() => {
    run({
      reader: Deno.stdin,
      writer: Deno.stdout,
    });
  });
export default command;
