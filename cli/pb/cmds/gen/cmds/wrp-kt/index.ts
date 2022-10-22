import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { createLoader } from "../../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../../core/schema/builder.ts";
import save from "../../../../../../codegen/save.ts";
import gen from "../../../../../../codegen/kt/wrp.ts";
import { getVendorDir } from "../../../../config.ts";
import expandEntryPaths from "../../expandEntryPaths.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
  host: string[];
  guest: string[];
  outDir: string;
}

export default new Command()
  .arguments("[proto-files...:string]")
  .option(
    "--entry-path <dir:string>",
    "Specify the directory containing entry proto files.",
    { collect: true },
  )
  .option(
    "--proto-path <dir:string>",
    "Specify the directory in which to search for imports.",
    { collect: true },
  )
  .option(
    "--host <type-path:string>",
    "The host service to generate.",
    { collect: true, required: true },
  )
  .option(
    "--guest <type-path:string>",
    "The guest service to generate.",
    { collect: true, required: true },
  )
  .option(
    "-o, --out-dir <value:string>",
    "Out directory",
    { default: "out" },
  )
  .description("Generate WRP library for Kotlin.")
  .action(async (options: Options, ...protoFiles: string[]) => {
    const entryPaths = options.entryPath ?? [];
    const protoPaths = options.protoPath ?? [];
    const roots = [...entryPaths, ...protoPaths, Deno.cwd(), getVendorDir()];
    const loader = createLoader({ roots });
    const files = [
      ...await expandEntryPaths(entryPaths),
      ...protoFiles,
    ];
    const schema = await build({ loader, files });
    const hostServicePaths = new Set(options.host.map(toTypepath));
    const guestServicePaths = new Set(options.guest.map(toTypepath));
    await save(
      options.outDir,
      gen(schema, { hostServicePaths, guestServicePaths }),
    );
  });

function toTypepath(path: string): `.${string}` {
  return `.${path}`;
}
