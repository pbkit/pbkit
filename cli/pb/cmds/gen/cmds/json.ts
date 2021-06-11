import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";
import {
  createLoader,
  vendorPath,
} from "../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../core/schema/builder.ts";

interface Options {
  protoPaths: string[];
}

export default new Command()
  .arguments("<proto-files...:string>")
  .option(
    "--proto-paths <dir...:string>",
    "Specify the directory in which to search for imports.",
  )
  .description("Generate json.")
  .action(async (options: Options, protoFiles: string[]) => {
    const protoPaths = options.protoPaths ?? [];
    const loader = createLoader({
      roots: [...protoPaths, Deno.cwd(), vendorPath],
    });
    const schema = await build({ loader, files: protoFiles });
    console.log(JSON.stringify(schema, null, 2));
  });
