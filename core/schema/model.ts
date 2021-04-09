import { ParseResult } from "../parser/proto.ts";

export interface Schema {
  files: { [filePath: string]: File };
  types: { [typePath: string]: Type };
  // services
  // extends
}

export type OptionValue = boolean | number | string;
export interface Options {
  [optionName: string]: OptionValue;
}

export interface File {
  parseResult?: ParseResult;
  syntax: "proto2" | "proto3";
  package: string;
  imports: Import[];
  options: Options;
}

export interface Import {
  kind: "" | "public" | "weak";
  filePath: string;
}

export type Type = Message | Enum;
interface TypeBase {
  filePath: string;
  options: Options;
  comment: string;
}
interface FieldBase {
  comment: string;
}

export interface Message extends TypeBase {
  fields: Map<number, MessageField>;
  reservedFieldNumberRanges: Range[];
  reservedFieldNames: string[];
  extensions: Range[];
}

export interface Enum extends TypeBase {
  fields: Map<number, EnumField>;
}

export interface EnumField extends FieldBase {
  name: string;
}

export type MessageField =
  | NormalField
  | RequiredField
  | OptionalField
  | RepeatedField
  | OneofField
  | MapField;
interface MessageFieldBase<TKind extends string> extends FieldBase {
  kind: TKind;
  type: string; // relative
  name: string;
  comment: string;
}
export interface NormalField extends MessageFieldBase<"normal"> {}
export interface RequiredField extends MessageFieldBase<"required"> {}
export interface OptionalField extends MessageFieldBase<"optional"> {}
export interface RepeatedField extends MessageFieldBase<"repeated"> {}
export interface OneofField extends MessageFieldBase<"oneof"> {
  oneof: string;
}
export interface MapField extends MessageFieldBase<"map"> {
  keyType: string; // relative
}

export interface Range {
  from: number;
  to: number; // max: Infinity
}
