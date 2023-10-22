import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";

const command = new Command();
command
  .description("Generate code.")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command(
    "file-descriptor-set",
    (await import("./cmds/file-descriptor-set.ts")).default,
  )
  .command("protoc-plugin", (await import("./cmds/protoc-plugin.ts")).default)
  .command("schema", (await import("./cmds/schema.ts")).default)
  .command("swift", (await import("./cmds/swift/index.ts")).default)
  .command("ts", (await import("./cmds/ts/index.ts")).default)
  .command("wrp-kt", (await import("./cmds/wrp-kt/index.ts")).default);
export default command;
