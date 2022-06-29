import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { BufWriter } from "https://deno.land/std@0.122.0/io/buffer.ts";
import * as path from "https://deno.land/std@0.122.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.122.0/fs/mod.ts";
import { getVendorDir } from "../../../config.ts";
import expandEntryPaths from "../expandEntryPaths.ts";
import { build } from "../../../../../core/schema/builder.ts";
import { createLoader } from "../../../../../core/loader/deno-fs.ts";
import { convertSchemaToFileDescriptorSet } from "../../../../../compat/protoc/file-descriptor-set.ts";
import {
  encodeBinary as encodeCodeGeneratorRequest,
} from "../../../../../generated/messages/google/protobuf/compiler/CodeGeneratorRequest.ts";
import {
  decodeBinary as decodeCodeGeneratorResponse,
} from "../../../../../generated/messages/google/protobuf/compiler/CodeGeneratorResponse.ts";
import { FileDescriptorProto } from "../../../../../generated/messages/google/protobuf/index.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
  pluginPath: string;
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
    "--plugin-path <dir:string>",
    "Specify the directory of protoc plugin binary",
    { required: true },
  )
  .option(
    "--proto-path <dir:string>",
    "Specify the directory in which to search for imports.",
    { collect: true },
  )
  .option("-o, --out-dir <value:string>", "Out directory", { default: "out" })
  .description("Generate codes using protoc plugin.")
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
    const fileDescriptorSet = convertSchemaToFileDescriptorSet({ schema });
    const plugin = Deno.run({
      cmd: [options.pluginPath],
      stdin: "piped",
      stdout: "piped",
    });
    const request = {
      fileToGenerate: Object.values(schema.files).map((file) =>
        file.importPath
      ),
      protoFile: topo(fileDescriptorSet.file),
      parameter: "long_type_string",
    };
    const payload = encodeCodeGeneratorRequest(request);
    const writer = new BufWriter(plugin.stdin);
    await writer.write(payload);
    await writer.flush();
    plugin.stdin.close();
    const output = await plugin.output();
    const { error, file } = decodeCodeGeneratorResponse(output);
    if (error && error.length > 0) {
      throw new Error("Failed to generate code: " + error);
    }
    for await (const { name: filePath, content } of file) {
      if (!filePath || !content) continue;
      const outPath = path.resolve(options.outDir, filePath);
      await ensureDir(path.dirname(outPath));
      const outFile = await Deno.create(outPath);
      await outFile.write(new TextEncoder().encode(content));
    }
  });

function topo(files: FileDescriptorProto[]): FileDescriptorProto[] {
  const result: FileDescriptorProto[] = [];
  const queue = files.filter((file) => file.dependency.length === 0);
  let curr: FileDescriptorProto | undefined;
  while (curr = queue.pop()) {
    const name = curr.name;
    result.push(curr);
    const target = files.filter((file) =>
      file.dependency.includes(name!) &&
      file.dependency.every((dep) => result.some((res) => res.name === dep))
    );
    queue.push(...target);
  }
  return result;
}
