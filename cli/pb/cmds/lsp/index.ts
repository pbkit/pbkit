import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { run } from "../../../../language-server/server.ts";

const command = new Command();
command.description("Execute langauge server.").action(() => {
  run({
    reader: Deno.stdin,
    writer: Deno.stdout,
  });
});
export default command;
