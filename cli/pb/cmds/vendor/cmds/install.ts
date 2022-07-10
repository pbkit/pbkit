import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { ensureDir } from "https://deno.land/std@0.147.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { iterFiles } from "../../../../../misc/archive/zip.ts";
import { getVendorDir } from "../../../config.ts";
import downloadRepoAndExtractProtoFiles from "../downloadRepoAndExtractProtoFiles.ts";

interface Options {
  protobufOnly?: boolean;
  quiet?: boolean;
}

export default new Command()
  .option(
    "--protobuf-only",
    "Install only proto files of github:protocolbuffers/protobuf.zip.",
  )
  .option(
    "--quiet",
    "Skip printing log messages.",
  )
  .description("Install vendor proto files.")
  .action(async (options: Options) => {
    const { protobufOnly = false, quiet = false } = options;
    const vendorDir = getVendorDir();
    const protoFiles = iterProtoFiles(protobufOnly, quiet);
    for await (const { fileName, data } of protoFiles) {
      const savePath = path.resolve(vendorDir, fileName);
      if (!quiet) console.log(`Writing ${savePath}...`);
      await ensureDir(path.dirname(savePath));
      await Deno.writeFile(savePath, data);
    }
  });

async function* iterProtoFiles(protobufOnly: boolean, quiet: boolean) {
  const verbose = !quiet;
  yield* iterFiles(
    await downloadRepoAndExtractProtoFiles({
      user: "protocolbuffers",
      repo: "protobuf",
      rev: "master",
      filter: (file) =>
        file.startsWith("google/protobuf/") &&
        file.endsWith(".proto"),
      depth: 2,
      verbose,
    }),
  );
  if (protobufOnly) return;
  yield* iterFiles(
    await downloadRepoAndExtractProtoFiles({
      user: "googleapis",
      repo: "googleapis",
      rev: "master",
      filter: (file) => file.endsWith(".proto"),
      verbose,
    }),
  );
}
