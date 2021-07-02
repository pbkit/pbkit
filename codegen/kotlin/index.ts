import { walk } from "https://deno.land/std@0.98.0/fs/walk.ts";
import {
  join,
  relative,
  resolve,
} from "https://deno.land/std@0.98.0/path/mod.ts";
import { Schema } from "../../core/schema/model.ts";
import { getAutoClosingFileReader } from "../../misc/file.ts";
import { CodeEntry } from "../index.ts";
import genMessages, { Field, wellKnownTypeMapping } from "./messages.ts";
import genServices from "./services.ts";
import { ImportBuffer } from "./import-buffer.ts";

export interface GenConfig {
  customTypeMapping?: CustomTypeMapping;
}

export interface CustomTypeMapping {
  [typePath: string]: {
    tsType: string;
    getWireValueToTsValueCode: GetWireValueToTsValueCodeFn;
  };
}

export interface GetWireValueToTsValueCodeFn {
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
  const customTypeMapping: CustomTypeMapping = {
    ...wellKnownTypeMapping,
    ...config.customTypeMapping,
  };

  // copy runtime files
  for await (const { path: filePath } of walk(runtimePath, { exts: [".ts"] })) {
    if (filePath.endsWith(".test.ts")) continue;
    const file = await getAutoClosingFileReader(filePath);
    yield [
      join("runtime", relative(runtimePath, filePath)),
      file,
    ];
  }

  // gen messages
  for (const [filePath, data] of genMessages(schema, customTypeMapping)) {
    yield [filePath, data];
  }

  // gen services
  for (const [filePath, data] of genServices(schema, customTypeMapping)) {
    yield [filePath, data];
  }
}

const __dirname = new URL(".", import.meta.url).pathname;
const runtimePath: string = resolve(__dirname, "../../core/runtime");
