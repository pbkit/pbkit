import { CodeFragment } from "./code-fragment.ts";
import { ImportBuffer } from "./import-buffer.ts";
import { Field } from "./messages.ts";

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
