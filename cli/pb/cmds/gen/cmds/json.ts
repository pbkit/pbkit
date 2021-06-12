import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";
import {
  createLoader,
  vendorPath,
} from "../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../core/schema/builder.ts";
import gen from "../../../../../core/generator/json/index.ts";

interface Options {
  protoPath?: string[];
  ast?: boolean;
  space?: Parameters<typeof JSON.stringify>[2];
}

export default new Command()
  .arguments("<proto-files...:string>")
  .option(
    "--proto-path <dir:string>",
    "Specify the directory in which to search for imports.",
    { collect: true },
  )
  .option("--ast", "Include parse result to JSON")
  .option(
    "--space <value:number>",
    "The number of space characters to use as white space for indenting.",
  )
  .description("Generate json.")
  .action(async (options: Options, protoFiles: string[]) => {
    const protoPaths = options.protoPath ?? [];
    const roots = [...protoPaths, Deno.cwd(), vendorPath];
    const loader = createLoader({ roots });
    const schema = await build({ loader, files: protoFiles });
    console.log(gen(schema, {
      includeParseResult: options.ast,
      space: options.space,
    }));
  });
