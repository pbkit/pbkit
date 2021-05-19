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
interface TypeBase<TKind extends string> {
  kind: TKind;
  filePath: string;
  options: Options;
  description: string;
}
interface FieldBase {
  description: string;
}

export interface Message extends TypeBase<"message"> {
  fields: { [fieldNumber: number]: MessageField };
  groups: { [groupName: string]: Group };
  reservedFieldNumberRanges: Range[];
  reservedFieldNames: string[];
  extensions: Range[];
}

export interface Group {
  kind: "required" | "optional" | "repeated";
  options: Options;
  description: string;
  fieldNumber: number;
  fields: { [fieldNumber: number]: MessageField };
  groups: { [groupName: string]: Group };
  reservedFieldNumberRanges: Range[];
  reservedFieldNames: string[];
  extensions: Range[];
}

export interface Extend {
  filePath: string;
  message: string;
  description: string;
  fields: { [fieldNumber: number]: ExtendField };
  groups: { [groupName: string]: Group };
}

export interface Enum extends TypeBase<"enum"> {
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
  | RepeatedField;

export type MessageField =
  | NormalField
  | RequiredField
  | OptionalField
  | RepeatedField
  | OneofField
  | MapField;
interface MessageFieldBase<TKind extends string> extends FieldBase {
  kind: TKind;
  name: string;
  options: Options;
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
  type: string; // relative
  oneof: string;
}
export interface MapField extends MessageFieldBase<"map"> {
  keyType: string; // relative
  valueType: string; // relative
}

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
