import { StringReader } from "https://deno.land/std@0.175.0/io/string_reader.ts";
import { parse as parseYaml } from "https://deno.land/std@0.175.0/encoding/yaml.ts";
import { replaceTsFileExtensionInImportStatementFromReader } from "../../misc/compat/tsc.ts";
import { build, BuildConfig } from "../../core/schema/builder.ts";
import { CodeEntry } from "../index.ts";
import { join } from "../path.ts";
import { BundleConfig } from "./index.ts";
import { Export, Module } from "./code-fragment.ts";
import { ImportBuffer } from "./import-buffer.ts";

export interface AotConfig {
  modules: Iterable<Module>;
  runtimeDir?: string;
  iterRuntimeFiles?: () => AsyncGenerator<CodeEntry>;
}
export default async function* aot({
  modules,
  runtimeDir,
  iterRuntimeFiles,
}: AotConfig): AsyncGenerator<CodeEntry> {
  if (iterRuntimeFiles && runtimeDir && !runtimeDir.startsWith("../")) {
    yield* joinPathPrefix(runtimeDir, iterRuntimeFiles());
  }
  for (const module of modules) {
    module.resolveRefs();
    yield [
      module.filePath,
      new StringReader([
        "// @ts-nocheck\n",
        importBufferToCode(module.importBuffer),
        Array.from(module).map((fragment) => {
          if (fragment instanceof Export) {
            return `export ${fragment.codeFragment.toString("ts")}\n`;
          }
          const code = fragment.toString("ts");
          if (code) return `${code}\n`;
        }).filter((x) => x).join("\n"),
      ].join("")),
    ];
  }
}

export async function* joinPathPrefix(
  prefix: string,
  codes: AsyncGenerator<CodeEntry>,
): AsyncGenerator<CodeEntry> {
  for await (const [filePath, data] of codes) {
    yield [join(prefix, filePath), data];
  }
}

export async function* replaceExts(
  codes: AsyncGenerator<CodeEntry>,
  extInImport: string = ".ts",
): AsyncGenerator<CodeEntry> {
  const ext = extInImport.trim();
  const replaceExt = replaceTsFileExtensionInImportStatementFromReader;
  for await (const [filePath, data] of codes) {
    yield [filePath, ext !== ".ts" ? await replaceExt(data, ext) : data];
  }
}

function importBufferToCode(importBuffer: ImportBuffer): string {
  const froms = Array.from(importBuffer.froms());
  if (froms.length < 1) return "";
  return froms.flatMap(({ from, imports }) => {
    const entries = Array.from(imports());
    const importStars = entries.filter(({ item }) => item === "*");
    const normalImports = entries.filter(({ item }) => item !== "*");
    const codes = importStars.map(
      ({ as }) => `import * as ${as} from "${from}";\n`,
    );
    if (normalImports.length) {
      const itemsCode = normalImports.map(({ as, item }) => {
        if (as.toString() === item) return `  ${item},\n`;
        return `  ${item} as ${as},\n`;
      }).join("");
      codes.push(`import {\n${itemsCode}} from "${from}";\n`);
    }
    return codes;
  }).join("") + "\n";
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
): Promise<BundleConfig> {
  return {
    indexFilename: yaml["index-filename"],
    runtime: yaml["runtime-package"]
      ? { type: "packageName", packageName: yaml["runtime-package"].trim() }
      : { type: "outDir", outDir: (yaml["runtime-dir"] ?? "runtime").trim() },
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

export interface YamlTextToBundleConfigResult {
  outDir: string;
  bundleConfig: BundleConfig;
  extInImport: string;
}
export async function yamlTextToBundleConfig(
  configYamlText: string,
  getBuildConfig: GetBuildConfigFn,
): Promise<YamlTextToBundleConfigResult> {
  const yaml = parseYaml(configYamlText) as BundleConfigYaml;
  return {
    outDir: yaml["out-dir"] ?? "out",
    bundleConfig: await yamlToBundleConfig(yaml, getBuildConfig),
    extInImport: yaml["ext-in-import"] ?? ".ts",
  };
}
