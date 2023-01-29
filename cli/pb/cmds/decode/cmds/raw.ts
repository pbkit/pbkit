import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { readAll } from "https://deno.land/std@0.175.0/streams/read_all.ts";
import { writeAll } from "https://deno.land/std@0.175.0/streams/write_all.ts";
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
    await writeAll(Deno.stdout, new TextEncoder().encode(text));
  });
