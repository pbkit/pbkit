import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import fileDescriptorSet from "./cmds/file-descriptor-set.ts";
import protocPlugin from "./cmds/protoc-plugin.ts";
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
  .command("file-descriptor-set", fileDescriptorSet)
  .command("protoc-plugin", protocPlugin)
  .command("schema", schema)
  .command("swift", swift)
  .command("ts", ts);
export default command;
