import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import schema from "./cmds/schema.ts";
import swift from "./cmds/swift/index.ts";
import ts from "./cmds/ts/index.ts";

const command = new Command();
command
  .description("Generate code.")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("schema", schema)
  .command("swift", swift)
  .command("ts", ts);
export default command;
