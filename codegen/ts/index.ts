import { Schema } from "../../core/schema/model.ts";
import { join } from "../path.ts";
import genMessages, { getWellKnownTypeMapping } from "./messages.ts";
import genServices from "./services.ts";
import {
  createImportBuffer as createImportBufferFn,
  CreateImportBufferFn,
  ImportBuffer,
} from "./import-buffer.ts";
import { createIndexBuffer, IndexBuffer } from "./index-buffer.ts";
import { CodeFragment, Module, ts } from "./code-fragment.ts";
import { Field } from "./messages.ts";

export * from "./aot.ts";
export { default as aot } from "./aot.ts";

export * from "./jit.ts";
export { default as jit } from "./jit.ts";

export type GenConfig = Omit<BundleConfig, "units"> & {
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
};
export default function gen(
  schema: Schema,
  config: GenConfig = {},
): Generator<Module> {
  const { messages, services } = config;
  const units = [{ schema, messages, services }];
  return filterDuplicates(genAll({ ...config, units }));
}

export interface BundleConfig {
  units: GenUnit[];
  customTypeMapping?: CustomTypeMapping;
  runtime?: RuntimeConfig;
  indexFilename?: string;
}
export interface GenUnit {
  schema: Schema;
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
}
export function bundle(config: BundleConfig): Generator<Module> {
  return filterDuplicates(genAll(config));
}

type GenAllConfig = BundleConfig;
function* genAll(config: GenAllConfig): Generator<Module> {
  const { units, customTypeMapping, runtime, indexFilename } = config;
  const _runtime = (
    runtime ?? { type: "packageName", packageName: "@pbkit/runtime" }
  );
  const createImportBuffer: CreateImportBufferFn = () => (
    createImportBufferFn(
      function getAddRuntimeImportFn(addInternalImport, addImport) {
        return function addRuntimeImport({ here, from, item, as, type }) {
          switch (_runtime.type) {
            case "outDir": {
              return addInternalImport({
                here,
                from: join(_runtime.outDir, from),
                item,
                as,
                type,
              });
            }
            case "packageName": {
              return addImport({
                from: join(_runtime.packageName, from),
                item,
                as,
                type,
              });
            }
          }
        };
      },
    )
  );
  const indexBuffer = createIndexBuffer({ indexFilename });
  for (const unit of units) {
    yield* genBuildUnit(
      unit,
      createImportBuffer,
      indexBuffer,
      customTypeMapping,
    );
  }
  for (const index of indexBuffer) {
    const { filePath, importAllFroms, exportTypes, reExportTypes } = index;
    const importBuffer = createImportBuffer();
    for (const { as, from } of importAllFroms) {
      importBuffer.addImport({ from, item: "*", as });
    }
    const codes: string[] = [];
    if (exportTypes.length) {
      codes.push(
        `export type {\n${
          exportTypes.map((type) => `  ${type},\n`).join("")
        }};`,
      );
    }
    for (const { item, as, from } of reExportTypes) {
      codes.push(`export type { ${item} as ${as} } from "${from}";`);
    }
    yield new Module(filePath, importBuffer).code(ts([codes.join("\n")]));
  }
}

function* genBuildUnit(
  unit: GenUnit,
  createImportBuffer: CreateImportBufferFn,
  indexBuffer: IndexBuffer,
  _customTypeMapping?: CustomTypeMapping,
): Generator<Module> {
  const { schema } = unit;
  const messages = unit.messages ?? { outDir: "messages" };
  const services = unit.services ?? { outDir: "services" };
  const customTypeMapping: CustomTypeMapping = {
    ...getWellKnownTypeMapping({ messages }),
    ..._customTypeMapping,
  };
  yield* genMessages(schema, {
    createImportBuffer,
    indexBuffer,
    customTypeMapping,
    messages,
  });
  yield* genServices(schema, {
    createImportBuffer,
    indexBuffer,
    messages,
    services,
  });
}

function* filterDuplicates(modules: Generator<Module>): Generator<Module> {
  const filter = new Set<string>();
  for (const module of modules) {
    const { filePath } = module;
    if (filter.has(filePath)) continue;
    filter.add(filePath);
    yield module;
  }
}

export type RuntimeConfig =
  | { type: "outDir"; outDir: string }
  | { type: "packageName"; packageName: string };
export interface GenMessagesConfig {
  outDir: string;
}
export interface GenServicesConfig {
  outDir: string;
}

export interface CustomTypeMapping {
  [typePath: string]: {
    tsType: CodeFragment;
    getWireValueToTsValueCode: GetFieldCodeFn;
    getTsValueToWireValueCode: GetFieldCodeFn;
    getTsValueToJsonValueCode: GetFieldCodeFn;
    getJsonValueToTsValueCode: GetFieldCodeFn;
  };
}
export interface GetFieldCodeFnConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
}
export interface GetFieldCodeFn {
  (config: GetFieldCodeFnConfig): CodeFragment | undefined;
}
