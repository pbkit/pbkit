import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import resolveRev from "../resolveRev.ts";
import download from "../download.ts";

export default new Command()
  .arguments("[version:string]")
  .description("Downloaded pbkit <version>. (default: latest)")
  .action(async (_: void, version = "latest") => {
    const rev = await resolveRev(version);
    await download(rev);
  });
