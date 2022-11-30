import { StringReader } from "https://deno.land/std@0.147.0/io/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.147.0/encoding/yaml.ts";
import { build, BuildConfig } from "../../core/schema/builder.ts";
import { Schema } from "../../core/schema/model.ts";
import { replaceTsFileExtensionInImportStatementFromReader } from "../../misc/compat/tsc.ts";
import { CodeEntry } from "../index.ts";
import { join } from "../path.ts";
import genMessages, { getWellKnownTypeMapping } from "./messages.ts";
import genServices from "./services.ts";
import {
  createImportBuffer as createImportBufferFn,
  CreateImportBufferFn,
  ImportBuffer,
} from "./import-buffer.ts";
import { createIndexBuffer, IndexBuffer } from "./index-buffer.ts";
import { CustomTypeMapping } from "./index.ts";
import { Export, Module } from "./code-fragment.ts";

export type GenConfig = Omit<BundleConfig, "units"> & {
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
};
export default function gen(
  schema: Schema,
  config: GenConfig = {},
): AsyncGenerator<CodeEntry> {
  const { messages, services } = config;
  const units = [{ schema, messages, services }];
  return replaceExts(
    filterDuplicates(genAll({ ...config, units })),
    config.extInImport,
  );
}

export interface BundleConfig {
  units: GenUnit[];
  customTypeMapping?: CustomTypeMapping;
  runtime?: GenRuntimeConfig;
  indexFilename?: string;
  extInImport?: string;
}
export interface GenUnit {
  schema: Schema;
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
}
export function bundle(config: BundleConfig): AsyncGenerator<CodeEntry> {
  return replaceExts(filterDuplicates(genAll(config)), config.extInImport);
}

type GenAllConfig = Omit<BundleConfig, "extInImport">;
async function* genAll(config: GenAllConfig): AsyncGenerator<CodeEntry> {
  const { units, customTypeMapping, runtime, indexFilename } = config;
  const _runtime = runtime ?? { packageName: "@pbkit/runtime" };
  if (_runtime.packageName == null && !_runtime.outDir.startsWith("../")) {
    for await (const [filePath, data] of _runtime.iterRuntimeFiles()) {
      yield [join(_runtime.outDir, filePath), data];
    }
  }
  const createImportBuffer: CreateImportBufferFn = (config) => (
    createImportBufferFn({
      ...config,
      getAddRuntimeImportFn(addInternalImport, addImport) {
        return function addRuntimeImport(here, from, item, as) {
          if (_runtime.packageName == null) {
            const _from = join(_runtime.outDir, from);
            return addInternalImport(here, _from, item, as);
          } else {
            const _from = join(_runtime.packageName, from);
            return addImport(_from, item, as);
          }
        };
      },
    })
  );
  const indexBuffer = createIndexBuffer({ indexFilename });
  for await (const unit of units) {
    yield* genBuildUnit(
      unit,
      createImportBuffer,
      indexBuffer,
      customTypeMapping,
    );
  }
  yield* indexBuffer;
}

async function* genBuildUnit(
  unit: GenUnit,
  createImportBuffer: CreateImportBufferFn,
  indexBuffer: IndexBuffer,
  _customTypeMapping?: CustomTypeMapping,
): AsyncGenerator<CodeEntry> {
  const { schema } = unit;
  const messages = unit.messages ?? { outDir: "messages" };
  const services = unit.services ?? { outDir: "services" };
  const customTypeMapping: CustomTypeMapping = {
    ...getWellKnownTypeMapping({ messages }),
    ..._customTypeMapping,
  };
  const messageModules = genMessages(schema, {
    createImportBuffer,
    indexBuffer,
    customTypeMapping,
    messages,
  });
  for (const module of messageModules) yield moduleToCodeEntry(module);
  const serviceModules = genServices(schema, {
    createImportBuffer,
    indexBuffer,
    messages,
    services,
  });
  for (const module of serviceModules) yield moduleToCodeEntry(module);
}
function moduleToCodeEntry(module: Module): CodeEntry {
  return [
    module.filePath,
    new StringReader([
      importBufferToCode(module.importBuffer),
      module.fragments.map((fragment) => {
        if (fragment instanceof Export) {
          return `export ${fragment.codeFragment.toString("ts")}\n`;
        }
        const code = fragment.toString("ts");
        if (code) return `${code}\n`;
      }).filter((x) => x).join("\n"),
    ].join("")),
  ];
}

function importBufferToCode(importBuffer: ImportBuffer): string {
  const froms = importBuffer.getTable();
  if (Object.keys(froms).length < 1) return "";
  return Object.entries(froms).map(([from, items]) => {
    const itemsCode = Object.entries(items).map(([as, item]) => {
      if (as === item) return `  ${item},\n`;
      return `  ${item} as ${as},\n`;
    }).join("");
    return `import {\n${itemsCode}} from "${from}";\n`;
  }).join("") + "\n";
}

async function* filterDuplicates(
  codes: AsyncGenerator<CodeEntry>,
): AsyncGenerator<CodeEntry> {
  const filter = new Set<string>();
  for await (const [filePath, data] of codes) {
    if (filter.has(filePath)) continue;
    filter.add(filePath);
    yield [filePath, data];
  }
}

async function* replaceExts(
  codes: AsyncGenerator<CodeEntry>,
  extInImport: string = ".ts",
): AsyncGenerator<CodeEntry> {
  const ext = extInImport.trim();
  const replaceExt = replaceTsFileExtensionInImportStatementFromReader;
  for await (const [filePath, data] of codes) {
    yield [filePath, ext !== ".ts" ? await replaceExt(data, ext) : data];
  }
}

export interface BundleConfigYaml {
  ["out-dir"]?: string;
  ["index-filename"]?: string;
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
    indexFilename: yaml["index-filename"],
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

export async function yamlTextToBundleConfig(
  configYamlText: string,
  getBuildConfig: GetBuildConfigFn,
  iterRuntimeFiles: () => AsyncGenerator<CodeEntry>,
): Promise<[string, BundleConfig]> {
  const yaml = parseYaml(configYamlText) as BundleConfigYaml;
  const outDir = yaml["out-dir"] ?? "out";
  return [
    outDir,
    await yamlToBundleConfig(
      yaml,
      getBuildConfig,
      iterRuntimeFiles,
    ),
  ];
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
