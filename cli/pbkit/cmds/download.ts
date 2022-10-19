import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import resolveRev from "../resolveRev.ts";
import download from "../download.ts";

interface Options {}

export default new Command()
  .arguments("[version:string]")
  .description("Downloaded pbkit <version>. (default: latest)")
  .action(async (_options: Options, version: string = "latest") => {
    const rev = await resolveRev(version);
    await download(rev);
  });
