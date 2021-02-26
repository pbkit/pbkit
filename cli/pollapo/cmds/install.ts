import * as path from "https://deno.land/std@0.84.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.17.2/command/mod.ts";
import { getPollapoYml } from "../pollapoYml.ts";

export default new Command()
  .description("Install dependencies.")
  .action(async () => {
    const pollapoYml = await getPollapoYml();
    if (!pollapoYml) {
      console.error(`"${path.resolve("pollapo.yml")}" not found.`);
      Deno.exit(1);
    }
    console.log(pollapoYml); // TODO
  });
