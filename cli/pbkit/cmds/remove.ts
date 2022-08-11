import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";

interface Options {}

export default new Command()
  .arguments("<versions...:string>")
  .description("Remove given pbkit versions.")
  .action(async (_options: Options, versions: string[]) => {
    // TODO
  });
