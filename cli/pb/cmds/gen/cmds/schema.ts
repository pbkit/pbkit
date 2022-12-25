import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { createLoader } from "../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../core/schema/builder.ts";
import { Schema } from "../../../../../core/schema/model.ts";
import { decodeBinary } from "../../../../../generated/messages/google/protobuf/FileDescriptorSet.ts";
import { convertFileDescriptorSetToSchema } from "../../../../../compat/protoc/file-descriptor-set/fds2pbkit.ts";
import gen from "../../../../../codegen/json/index.ts";
import { getVendorDir } from "../../../config.ts";
import expandEntryPaths from "../expandEntryPaths.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
  descriptorSetIn?: string;
  ast?: boolean;
  space?: Parameters<typeof JSON.stringify>[2];
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
    "--descriptor-set-in <path:string>",
    "Specify FileDescriptorSet path to build schema. If this option is used, other options used to build schema are ignored.",
  )
  .option("--ast", "Include parse result to output")
  .option(
    "--space <value:number>",
    "The number of space characters to use as white space for indenting.",
  )
  .description("Generate pbkit style schema representation.")
  .action(async (options: Options, ...protoFiles: string[]) => {
    const schema = await getSchemaFromOptions(options, protoFiles);
    console.log(gen(schema, {
      includeParseResult: options.ast,
      space: options.space,
    }));
  });

async function getSchemaFromOptions(
  options: Options,
  protoFiles: string[],
): Promise<Schema> {
  if (options.descriptorSetIn) {
    const fileDescriptorSet = decodeBinary(
      await Deno.readFile(options.descriptorSetIn),
    );
    return convertFileDescriptorSetToSchema({ fileDescriptorSet });
  } else {
    const entryPaths = options.entryPath ?? [];
    const protoPaths = options.protoPath ?? [];
    const roots = [...entryPaths, ...protoPaths, Deno.cwd(), getVendorDir()];
    const loader = createLoader({ roots });
    const files = [
      ...await expandEntryPaths(entryPaths),
      ...protoFiles,
    ];
    return await build({ loader, files });
  }
}
