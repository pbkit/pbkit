import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { writeAll } from "https://deno.land/std@0.136.0/streams/conversion.ts";
import { createLoader } from "../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../core/schema/builder.ts";
import deserialize from "../../../../../core/runtime/wire/deserialize.ts";
import { encode } from "../../../../../compat/protoc/text-format.ts";
import { encodeBinary } from "../../../../../generated/messages/google/protobuf/FileDescriptorSet.ts";
import { convertSchemaToFileDescriptorSet } from "../../../../../compat/protoc/file-descriptor-set.ts";
import { getVendorDir } from "../../../config.ts";
import expandEntryPaths from "../expandEntryPaths.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
  text?: boolean;
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
  .option("--text", "Output in text format.")
  .description("Generate FileDescriptorSet.")
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
    const fileDescriptorSet = convertSchemaToFileDescriptorSet({ schema });
    const fileDescroptorSetBinary = encodeBinary(fileDescriptorSet);
    if (options.text) {
      const wireMessage = deserialize(fileDescroptorSetBinary);
      const typePath = ".google.protobuf.FileDescriptorSet";
      const roots = [getVendorDir()];
      const loader = createLoader({ roots });
      const files = ["google/protobuf/descriptor.proto"];
      const schema = await build({ loader, files });
      const text = encode(wireMessage, { schema, typePath });
      await writeAll(Deno.stdout, new TextEncoder().encode(text));
    } else {
      await writeAll(Deno.stdout, fileDescroptorSetBinary);
    }
  });
