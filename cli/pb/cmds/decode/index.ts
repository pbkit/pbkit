import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import {
  readAll,
  writeAll,
} from "https://deno.land/std@0.136.0/streams/conversion.ts";
import { createLoader } from "../../../../core/loader/deno-fs.ts";
import { build } from "../../../../core/schema/builder.ts";
import { encode } from "../../../../compat/protoc/text-format.ts";
import deserialize from "../../../../core/runtime/wire/deserialize.ts";
import { getVendorDir } from "../../config.ts";
import expandEntryPaths from "../gen/expandEntryPaths.ts";
import fileDescriptorSet from "./cmds/file-descriptor-set.ts";
import raw from "./cmds/raw.ts";

interface Options {
  type?: string;
  entryPath?: string[];
  protoPath?: string[];
}

const command = new Command();
command
  .arguments("[proto-files...:string]")
  .option("-t, --type <type:string>", "Type to decode")
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
  .description(
    "Read a binary message of the given type from standard input and write it in text format to standard output.",
  )
  .action(async (options: Options, ...protoFiles: string[]) => {
    const typePath = options.type ? "." + options.type : "";
    const entryPaths = options.entryPath ?? [];
    const protoPaths = options.protoPath ?? [];
    const roots = [...entryPaths, ...protoPaths, Deno.cwd(), getVendorDir()];
    const loader = createLoader({ roots });
    const files = [
      ...await expandEntryPaths(entryPaths),
      ...protoFiles,
    ];
    const schema = await build({ loader, files });
    const stdin = await readAll(Deno.stdin);
    const wireMessage = deserialize(stdin);
    const text = encode(wireMessage, { schema, typePath });
    await writeAll(Deno.stdout, new TextEncoder().encode(text));
  })
  .command("file-descriptor-set", fileDescriptorSet)
  .command("raw", raw);
export default command;
