import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";

interface Options {}

export default new Command()
  .arguments("<version:string>")
  .description(
    "Install pbkit <version> (default: latest, download if necessary).",
  )
  .action(async (_options: Options, version: string) => {
    // TODO
  });
