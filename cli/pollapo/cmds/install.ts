import { Command } from "https://deno.land/x/cliffy@v0.17.2/command/mod.ts";
import { getPollapoYml, PollapoYmlNotFoundError } from "../pollapoYml.ts";

export default new Command()
  .description("Install dependencies.")
  .action(async () => {
    try {
      const pollapoYml = await getPollapoYml();
      console.log(pollapoYml); // TODO
    } catch (err) {
      if (err instanceof PollapoYmlNotFoundError) {
        console.error(err.message);
        return Deno.exit(1);
      }
      throw err;
    }
  });
