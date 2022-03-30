import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import json from "./cmds/json.ts";
import ts from "./cmds/ts/index.ts";
import swift from "./cmds/swift/index.ts";

const command = new Command();
command
  .description("Generate code.")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("ts", ts)
  .command("json", json)
  .command("swift", swift);
export default command;
