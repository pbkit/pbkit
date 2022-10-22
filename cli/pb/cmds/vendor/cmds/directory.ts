import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { getVendorDir } from "../../../config.ts";

export default new Command()
  .description("Print pb vendor directory.")
  .action(async () => {
    console.log(getVendorDir());
  });
