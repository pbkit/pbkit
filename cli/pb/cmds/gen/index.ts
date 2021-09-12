import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";
import json from "./cmds/json.ts";
import ts from "./cmds/ts.ts";

const command = new Command();
command
  .description("Generate code.")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("json", json)
  .command("ts", ts);
export default command;
