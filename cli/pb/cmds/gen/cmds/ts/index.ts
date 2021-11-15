import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { createLoader } from "../../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../../core/schema/builder.ts";
import save from "../../../../../../codegen/save.ts";
import gen from "../../../../../../codegen/ts/index.ts";
import iterRuntimeFiles from "../../../../../../codegen/ts/iterRuntimeFiles.ts";
import { getVendorDir } from "../../../../config.ts";
import expandEntryPaths from "../../expandEntryPaths.ts";
import bundle from "./cmds/bundle.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
  runtimeDir: string;
  runtimePackage?: string;
  messagesDir: string;
  servicesDir: string;
  outDir: string;
  indexFilename: string;
  extInImport: string;
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
    "--runtime-dir <dir:string>",
    "Out directory for runtime.",
    { default: "runtime" },
  )
  .option(
    "--runtime-package <package:string>",
    "External runtimes you want to rely on instead of codegen.",
  )
  .option(
    "--messages-dir <dir:string>",
    "Out directory for messages.",
    { default: "messages" },
  )
  .option(
    "--services-dir <dir:string>",
    "Out directory for services.",
    { default: "services" },
  )
  .option(
    "-o, --out-dir <value:string>",
    "Out directory",
    { default: "out" },
  )
  .option(
    "--index-filename <filename:string>",
    "Specify the filename for re-exporting module.",
    { default: "index" },
  )
  .option(
    "--ext-in-import <extension:string>",
    "Specify the file extension in import statement.",
    { default: ".ts" },
  )
  .description("Generate typescript library.")
  .action(async (options: Options, protoFiles: string[] = []) => {
    const entryPaths = options.entryPath ?? [];
    const protoPaths = options.protoPath ?? [];
    const roots = [...entryPaths, ...protoPaths, Deno.cwd(), getVendorDir()];
    const loader = createLoader({ roots });
    const files = [
      ...await expandEntryPaths(entryPaths),
      ...protoFiles,
    ];
    const schema = await build({ loader, files });
    const indexFilename = options.indexFilename;
    const extInImport = options.extInImport;
    await save(
      options.outDir,
      gen(schema, {
        indexFilename,
        extInImport,
        runtime: options.runtimePackage
          ? { packageName: options.runtimePackage.trim() }
          : { iterRuntimeFiles, outDir: options.runtimeDir.trim() },
        messages: { outDir: options.messagesDir.trim() },
        services: { outDir: options.servicesDir.trim() },
      }),
    );
  })
  .command("bundle", bundle);
