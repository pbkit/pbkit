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
  importPath: string;
  syntax: "proto2" | "proto3";
  package: string;
  imports: Import[];
  options: Options;
  typePaths: string[];
  servicePaths: string[];
}

export interface Import {
  kind: "" | "public" | "weak";
  importPath: string;
  filePath?: string;
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
  type: string;
  typePath?: string;
}
export interface RequiredField extends MessageFieldBase<"required"> {
  type: string;
  typePath?: string;
}
export interface OptionalField extends MessageFieldBase<"optional"> {
  type: string;
  typePath?: string;
}
export interface RepeatedField extends MessageFieldBase<"repeated"> {
  type: string;
  typePath?: string;
}
export interface OneofField extends MessageFieldBase<"oneof"> {
  type: string;
  typePath?: string;
  oneof: string;
}
export interface MapField extends MessageFieldBase<"map"> {
  keyType: string;
  keyTypePath?: string;
  valueType: string;
  valueTypePath?: string;
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
  type: string;
  typePath?: string;
}
