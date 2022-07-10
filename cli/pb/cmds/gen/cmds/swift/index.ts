import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import {
  isAbsolute,
  normalize,
  resolve,
  toFileUrl,
} from "https://deno.land/std@0.147.0/path/mod.ts";
import { createLoader } from "../../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../../core/schema/builder.ts";
import save from "../../../../../../codegen/save.ts";
import gen, { ServiceType } from "../../../../../../codegen/swift/index.ts";
import { getVendorDir } from "../../../../config.ts";
import expandEntryPaths from "../../expandEntryPaths.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
  includePath?: string[];
  excludePath?: string[];
  messagesDir: string;
  servicesDir: string;
  grpcService?: boolean;
  wrpService?: boolean;
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
    "--include-path <dir:string>",
    "Specify the directory containing proto files to codegen.",
    { collect: true },
  )
  .option(
    "--exclude-path <dir:string>",
    "Specify the directory containing proto files to exclude from codegen.",
    { collect: true },
  )
  .option(
    "--grpc-service",
    "Generate gRPC service codes.",
  )
  .option(
    "--wrp-service",
    "Generate service codes for wrp (webview/worker request protocol)",
  )
  .description("Generate swift library which is dependent on SwiftProtobuf.")
  .action(async (options: Options, protoFiles: string[] = []) => {
    const entryPaths = options.entryPath ?? [];
    const protoPaths = options.protoPath ?? [];
    const includePaths = (options.includePath ?? []).map((path) =>
      toFileUrl(normalize(resolve(path))).href
    );
    const excludePaths = (options.excludePath ?? []).map((path) =>
      toFileUrl(normalize(resolve(path))).href
    );
    const roots = [...entryPaths, ...protoPaths, Deno.cwd(), getVendorDir()];
    const loader = createLoader({ roots });
    const files = [
      ...await expandEntryPaths(entryPaths),
      ...protoFiles,
    ];
    const schema = await build({ loader, files });
    const typePaths = Object.entries(schema.types).filter(([_, value]) =>
      filterFilePath(value.filePath)
    ).map(([typePath]) => typePath as `.${string}`);
    const servicePaths = Object.entries(schema.services).filter(
      ([_, value]) => filterFilePath(value.filePath),
    ).map(([servicePath]) => servicePath as `.${string}`);
    const serviceType = (() => {
      const types: ServiceType[] = [];
      if (options.grpcService) types.push("grpc");
      if (options.wrpService) types.push("wrp");
      return types;
    })();
    await save(
      options.outDir,
      gen(schema, {
        messages: { outDir: options.messagesDir.trim(), typePaths },
        services: {
          outDir: options.servicesDir.trim(),
          genTypes: serviceType,
          servicePaths,
        },
      }),
    );
    function filterFilePath(filePath: string) {
      return (!options.includePath ||
        includePaths.some((path) => filePath.startsWith(path))) &&
        !excludePaths.some((path) => filePath.startsWith(path));
    }
  });
