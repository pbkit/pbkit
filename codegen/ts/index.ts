import { Schema } from "../../core/schema/model.ts";
import { replaceTsFileExtensionInImportStatementFromReader } from "../../misc/compat/tsc.ts";
import { CodeEntry } from "../index.ts";
import iterRuntimeFiles from "./iterRuntimeFiles.ts";
import genMessages, { Field, wellKnownTypeMapping } from "./messages.ts";
import genServices from "./services.ts";
import { ImportBuffer } from "./import-buffer.ts";

export interface GenConfig {
  extInImport?: string;
  customTypeMapping?: CustomTypeMapping;
  iterRuntimeFiles?: () => AsyncGenerator<CodeEntry>;
}
export interface CustomTypeMapping {
  [typePath: string]: {
    tsType: string;
    getWireValueToTsValueCode: GetFieldCodeFn;
    getTsValueToWireValueCode: GetFieldCodeFn;
  };
}
export interface GetFieldCodeFn {
  (
    filePath: string,
    importBuffer: ImportBuffer,
    field: Field,
  ): string | undefined;
}
export default async function* gen(
  schema: Schema,
  config: GenConfig = {},
): AsyncGenerator<CodeEntry> {
  const ext = (config.extInImport ?? ".ts").trim();
  const replace = ext !== ".ts";
  const replaceExt = replaceTsFileExtensionInImportStatementFromReader;
  const customTypeMapping: CustomTypeMapping = {
    ...wellKnownTypeMapping,
    ...config.customTypeMapping,
  };
  async function* iterGeneratedFiles() {
    yield* (config.iterRuntimeFiles ?? iterRuntimeFiles)();
    yield* genMessages(schema, customTypeMapping);
    yield* genServices(schema, customTypeMapping);
  }
  for await (const [filePath, data] of iterGeneratedFiles()) {
    yield [filePath, replace ? await replaceExt(data, ext) : data];
  }
}
