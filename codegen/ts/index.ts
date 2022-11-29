import { ImportBuffer } from "./import-buffer.ts";
import { Field } from "./messages.ts";

export interface CustomTypeMapping {
  [typePath: string]: {
    tsType: string;
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
  (config: GetFieldCodeFnConfig): string | undefined;
}
