import { build, BuildConfig } from "../../core/schema/builder.ts";
import { Schema } from "../../core/schema/model.ts";
import { replaceTsFileExtensionInImportStatementFromReader } from "../../misc/compat/tsc.ts";
import { CodeEntry } from "../index.ts";
import { join } from "../path.ts";
import genMessages, { Field, getWellKnownTypeMapping } from "./messages.ts";
import genServices from "./services.ts";
import {
  createImportBuffer as createImportBufferFn,
  CreateImportBufferFn,
  ImportBuffer,
} from "./import-buffer.ts";

export interface GenConfig {
  extInImport?: string;
  customTypeMapping?: CustomTypeMapping;
  runtime?: GenRuntimeConfig;
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
}
export default async function* gen(
  schema: Schema,
  config: GenConfig = {},
): AsyncGenerator<CodeEntry> {
  const ext = (config.extInImport ?? ".ts").trim();
  const replace = ext !== ".ts";
  const replaceExt = replaceTsFileExtensionInImportStatementFromReader;
  const runtime = config.runtime ?? { packageName: "@pbkit/runtime" };
  const messages = config.messages ?? { outDir: "messages" };
  const services = config.services ?? { outDir: "services" };
  const createImportBuffer: CreateImportBufferFn = (config) => (
    createImportBufferFn({ ...config, runtime })
  );
  const customTypeMapping: CustomTypeMapping = {
    ...getWellKnownTypeMapping({ messages }),
    ...config.customTypeMapping,
  };
  async function* iterGeneratedFiles(): AsyncGenerator<CodeEntry> {
    if (runtime.packageName == null) {
      for await (const [filePath, data] of runtime.iterRuntimeFiles()) {
        yield [join(runtime.outDir, filePath), data];
      }
    }
    yield* genMessages(schema, {
      createImportBuffer,
      customTypeMapping,
      messages,
    });
    yield* genServices(schema, {
      createImportBuffer,
      customTypeMapping,
      messages,
      services,
    });
  }
  for await (const [filePath, data] of iterGeneratedFiles()) {
    yield [filePath, replace ? await replaceExt(data, ext) : data];
  }
}

export interface BundleConfig {
  extInImport?: string;
  customTypeMapping?: CustomTypeMapping;
  runtime?: GenRuntimeConfig;
  units: GenUnit[];
}
export interface GenUnit {
  schema: Schema;
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
}
export async function* bundle(config: BundleConfig): AsyncGenerator<CodeEntry> {
  const ext = (config.extInImport ?? ".ts").trim();
  const replace = ext !== ".ts";
  const replaceExt = replaceTsFileExtensionInImportStatementFromReader;
  const runtime = config.runtime ?? { packageName: "@pbkit/runtime" };
  const createImportBuffer: CreateImportBufferFn = (config) => (
    createImportBufferFn({ ...config, runtime })
  );
  async function* iterGeneratedFiles(unit: GenUnit): AsyncGenerator<CodeEntry> {
    const { schema } = unit;
    const messages = unit.messages ?? { outDir: "messages" };
    const services = unit.services ?? { outDir: "services" };
    const customTypeMapping: CustomTypeMapping = {
      ...getWellKnownTypeMapping({ messages }),
      ...config.customTypeMapping,
    };
    yield* genMessages(schema, {
      createImportBuffer,
      customTypeMapping,
      messages,
    });
    yield* genServices(schema, {
      createImportBuffer,
      customTypeMapping,
      messages,
      services,
    });
  }
  if (runtime.packageName == null) {
    for await (const [filePath, data] of runtime.iterRuntimeFiles()) {
      yield [
        join(runtime.outDir, filePath),
        replace ? await replaceExt(data, ext) : data,
      ];
    }
  }
  const filter = new Set<string>();
  for (const unit of config.units) {
    for await (const [filePath, data] of iterGeneratedFiles(unit)) {
      if (filter.has(filePath)) continue;
      filter.add(filePath);
      yield [filePath, replace ? await replaceExt(data, ext) : data];
    }
  }
}

export interface BundleConfigYaml {
  ["out-dir"]?: string;
  ["ext-in-import"]?: string;
  ["runtime-dir"]?: string;
  ["runtime-package"]?: string;
  ["units"]?: {
    ["proto-paths"]?: string[];
    ["entry-paths"]?: string[];
    ["proto-files"]?: string[];
    ["messages-dir"]?: string;
    ["services-dir"]?: string;
  }[];
}
export interface GetBuildConfigFn {
  (
    protoPaths: string[],
    entryPaths: string[],
    protoFiles: string[],
  ): Promise<BuildConfig>;
}
export async function yamlToBundleConfig(
  yaml: BundleConfigYaml,
  getBuildConfig: GetBuildConfigFn,
  iterRuntimeFiles: () => AsyncGenerator<CodeEntry>,
): Promise<BundleConfig> {
  return {
    extInImport: yaml["ext-in-import"],
    runtime: yaml["runtime-package"]
      ? { packageName: yaml["runtime-package"].trim() }
      : { iterRuntimeFiles, outDir: (yaml["runtime-dir"] ?? "runtime").trim() },
    units: await Promise.all((yaml["units"] ?? []).map(async (unit) => {
      const schema = await build(
        await getBuildConfig(
          unit["proto-paths"] ?? [],
          unit["entry-paths"] ?? [],
          unit["proto-files"] ?? [],
        ),
      );
      return {
        schema,
        messages: { outDir: (unit["messages-dir"] ?? "messages").trim() },
        services: { outDir: (unit["services-dir"] ?? "services").trim() },
      };
    })),
  };
}

export interface CustomTypeMapping {
  [typePath: string]: {
    tsType: string;
    getWireValueToTsValueCode: GetFieldCodeFn;
    getTsValueToWireValueCode: GetFieldCodeFn;
  };
}
export interface GetFieldCodeFnConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
}
export interface GetFieldCodeFn {
  (config: GetFieldCodeFnConfig): string | undefined;
}
export type GenRuntimeConfig = {
  iterRuntimeFiles: () => AsyncGenerator<CodeEntry>;
  outDir: string;
  packageName?: undefined;
} | {
  iterRuntimeFiles?: undefined;
  outDir?: undefined;
  packageName: string;
};
export interface GenMessagesConfig {
  outDir: string;
}
export interface GenServicesConfig {
  outDir: string;
}
