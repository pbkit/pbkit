import { ParseResult } from "../parser/proto.ts";

export interface Schema {
  files: { [filePath: string]: File };
  types: { [typePath: string]: Type };
  // services
  // extends
}

export interface File {
  parseResult?: ParseResult;
  syntax: "proto2" | "proto3";
  package: string;
  imports: Import[];
  // options
}

export interface Import {
  kind: "" | "public" | "weak";
  filePath: string;
}

export interface Type {
  filePath: string;
  // options
}

export interface Message extends Type {
  fields: Map<number, Field>;
  reservedFieldNumberRanges: Range[];
  reservedFieldNames: string[];
  extensions: Range[];
}

export interface Enum extends Type {
  fields: Map<number, string>;
}

export type Field =
  | NormalField
  | RequiredField
  | OptionalField
  | RepeatedField
  | OneofField
  | MapField;
interface FieldBase<TKind extends string> {
  kind: TKind;
  type: string; // relative
  name: string;
}
export interface NormalField extends FieldBase<"normal"> {}
export interface RequiredField extends FieldBase<"required"> {}
export interface OptionalField extends FieldBase<"optional"> {}
export interface RepeatedField extends FieldBase<"repeated"> {}
export interface OneofField extends FieldBase<"oneof"> {
  oneof: string;
}
export interface MapField extends FieldBase<"map"> {
  keyType: string; // relative
}

export interface Range {
  from: number;
  to: number; // max: Infinity
}
