import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import {
  readAll,
  writeAll,
} from "https://deno.land/std@0.136.0/streams/conversion.ts";
import { encodeSchemaless } from "../../../../../compat/protoc/text-format.ts";
import deserialize from "../../../../../core/runtime/wire/deserialize.ts";

export default new Command()
  .description(
    "Read an arbitrary protocol message from standard input and write the raw tag/value pairs in text format to standard output.",
  )
  .action(async () => {
    const stdin = await readAll(Deno.stdin);
    const wireMessage = deserialize(stdin);
    const text = encodeSchemaless(wireMessage);
    await writeAll(Deno.stderr, new TextEncoder().encode(text));
  });
