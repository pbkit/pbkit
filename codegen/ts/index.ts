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
