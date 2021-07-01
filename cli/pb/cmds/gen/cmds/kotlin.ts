import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";
import {
  createLoader,
  vendorPath,
} from "../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../core/schema/builder.ts";
import { save } from "../../../../../codegen/index.ts";
import gen from "../../../../../codegen/ts/index.ts";

interface Options {
  protoPath?: string[];
  outDir: string;
  removeTsFileExtensionInImportStatement?: boolean;
}

export default new Command()
  .arguments("<proto-files...:string>")
  .option(
    "--proto-path <dir:string>",
    "Specify the directory in which to search for imports.",
    { collect: true },
  )
  .option("-o, --out-dir <value:string>", "Out directory", {
    default: "out",
  })
  .description("Generate kotlin library.")
  .action(async (options: Options, protoFiles: string[]) => {
    const protoPaths = options.protoPath ?? [];
    const roots = [...protoPaths, Deno.cwd(), vendorPath];
    const loader = createLoader({ roots });
    const schema = await build({ loader, files: protoFiles });
    await save(
      options.outDir,
      gen(schema, {
        removeTsFileExtensionInImportStatement:
          options.removeTsFileExtensionInImportStatement,
      }),
    );
  });
