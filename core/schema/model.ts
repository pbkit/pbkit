import { ParseResult } from "../parser/proto.ts";

export interface Schema {
  files: { [filePath: string]: File };
  types: { [typePath: string]: Type }; // type name is included in typePath
  extends: { [typePath: string]: Extend[] };
  services: { [typePath: string]: Service }; // service name is included in typePath
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
  description: string;
}
interface FieldBase {
  description: string;
}

export interface Message extends TypeBase {
  fields: { [fieldNumber: number]: MessageField };
  reservedFieldNumberRanges: Range[];
  reservedFieldNames: string[];
  extensions: Range[];
}

export interface Extend {
  filePath: string;
  message: string;
  description: string;
  fields: { [fieldNumber: number]: ExtendField };
}

export interface Enum extends TypeBase {
  fields: { [fieldNumber: number]: EnumField };
}

export interface EnumField extends FieldBase {
  name: string;
  options: Options;
}

export type ExtendField =
  | NormalField
  | RequiredField
  | OptionalField
  | RepeatedField
  | RequiredGroupField
  | OptionalGroupField
  | RepeatedGroupField;
export type MessageField =
  | NormalField
  | RequiredField
  | OptionalField
  | RepeatedField
  | OneofField
  | MapField
  | RequiredGroupField
  | OptionalGroupField
  | RepeatedGroupField;
interface MessageFieldBase<TKind extends string> extends FieldBase {
  kind: TKind;
  name: string;
  group?: string;
}
export interface NormalField extends MessageFieldBase<"normal"> {
  type: string; // relative
}
export interface RequiredField extends MessageFieldBase<"required"> {
  type: string; // relative
}
export interface OptionalField extends MessageFieldBase<"optional"> {
  type: string; // relative
}
export interface RepeatedField extends MessageFieldBase<"repeated"> {
  type: string; // relative
}
export interface OneofField extends MessageFieldBase<"oneof"> {
  oneof: string;
}
export interface MapField extends MessageFieldBase<"map"> {
  keyType: string; // relative
  valueType: string; // relative
}
export interface RequiredGroupField
  extends MessageFieldBase<"required-group"> {}
export interface OptionalGroupField
  extends MessageFieldBase<"optional-group"> {}
export interface RepeatedGroupField
  extends MessageFieldBase<"repeated-group"> {}

export interface Range {
  from: number;
  to: number; // max: Infinity
}

export interface Service {
  filePath: string;
  options: Options;
  description: string;
  rpcs: { [rpcName: string]: Rpc };
}

export interface Rpc {
  options: Options;
  description: string;
  reqType: RpcType;
  resType: RpcType;
}

export interface RpcType {
  stream: boolean;
  type: string; // relative
}
