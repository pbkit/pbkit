import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import {
  readAll,
  writeAll,
} from "https://deno.land/std@0.136.0/streams/conversion.ts";
import { encode } from "../../../../../compat/protoc/text-format.ts";
import deserialize from "../../../../../core/runtime/wire/deserialize.ts";
import { createLoader } from "../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../core/schema/builder.ts";
import { getVendorDir } from "../../../config.ts";

export default new Command()
  .description(
    "Read an file descriptor set message from standard input and write in text format to standard output.",
  )
  .action(async () => {
    const typePath = ".google.protobuf.FileDescriptorSet";
    const roots = [getVendorDir()];
    const loader = createLoader({ roots });
    const files = ["google/protobuf/descriptor.proto"];
    const schema = await build({ loader, files });
    const stdin = await readAll(Deno.stdin);
    const wireMessage = deserialize(stdin);
    const text = encode(wireMessage, { schema, typePath });
    await writeAll(Deno.stdout, new TextEncoder().encode(text));
  });
