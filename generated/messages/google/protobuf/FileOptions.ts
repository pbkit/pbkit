import {
  Type as OptimizeMode,
  name2num,
  num2name,
} from "./(FileOptions)/OptimizeMode.ts";
import {
  Type as UninterpretedOption,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./UninterpretedOption.ts";
import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../../../../core/runtime/json/scalar.ts";
import {
  WireMessage,
  WireType,
} from "../../../../core/runtime/wire/index.ts";
import {
  default as serialize,
} from "../../../../core/runtime/wire/serialize.ts";
import {
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../../../../core/runtime/wire/scalar.ts";
import {
  default as Long,
} from "../../../../core/runtime/Long.ts";
import {
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf {
  export interface FileOptions {
    javaPackage?: string;
    javaOuterClassname?: string;
    optimizeFor?: OptimizeMode;
    javaMultipleFiles?: boolean;
    goPackage?: string;
    ccGenericServices?: boolean;
    javaGenericServices?: boolean;
    pyGenericServices?: boolean;
    javaGenerateEqualsAndHash?: boolean;
    deprecated?: boolean;
    javaStringCheckUtf8?: boolean;
    ccEnableArenas?: boolean;
    objcClassPrefix?: string;
    csharpNamespace?: string;
    swiftPrefix?: string;
    phpClassPrefix?: string;
    phpNamespace?: string;
    phpGenericServices?: boolean;
    phpMetadataNamespace?: string;
    rubyPackage?: string;
    uninterpretedOption: UninterpretedOption[];
  }
}
export type Type = $.google.protobuf.FileOptions;

export function getDefaultValue(): $.google.protobuf.FileOptions {
  return {
    javaPackage: "",
    javaOuterClassname: "",
    optimizeFor: "UNSPECIFIED",
    javaMultipleFiles: false,
    goPackage: "",
    ccGenericServices: false,
    javaGenericServices: false,
    pyGenericServices: false,
    javaGenerateEqualsAndHash: false,
    deprecated: false,
    javaStringCheckUtf8: false,
    ccEnableArenas: false,
    objcClassPrefix: "",
    csharpNamespace: "",
    swiftPrefix: "",
    phpClassPrefix: "",
    phpNamespace: "",
    phpGenericServices: false,
    phpMetadataNamespace: "",
    rubyPackage: "",
    uninterpretedOption: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.FileOptions>): $.google.protobuf.FileOptions {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.FileOptions): unknown {
  const result: any = {};
  if (value.javaPackage !== undefined) result.javaPackage = tsValueToJsonValueFns.string(value.javaPackage);
  if (value.javaOuterClassname !== undefined) result.javaOuterClassname = tsValueToJsonValueFns.string(value.javaOuterClassname);
  if (value.optimizeFor !== undefined) result.optimizeFor = tsValueToJsonValueFns.enum(value.optimizeFor);
  if (value.javaMultipleFiles !== undefined) result.javaMultipleFiles = tsValueToJsonValueFns.bool(value.javaMultipleFiles);
  if (value.goPackage !== undefined) result.goPackage = tsValueToJsonValueFns.string(value.goPackage);
  if (value.ccGenericServices !== undefined) result.ccGenericServices = tsValueToJsonValueFns.bool(value.ccGenericServices);
  if (value.javaGenericServices !== undefined) result.javaGenericServices = tsValueToJsonValueFns.bool(value.javaGenericServices);
  if (value.pyGenericServices !== undefined) result.pyGenericServices = tsValueToJsonValueFns.bool(value.pyGenericServices);
  if (value.javaGenerateEqualsAndHash !== undefined) result.javaGenerateEqualsAndHash = tsValueToJsonValueFns.bool(value.javaGenerateEqualsAndHash);
  if (value.deprecated !== undefined) result.deprecated = tsValueToJsonValueFns.bool(value.deprecated);
  if (value.javaStringCheckUtf8 !== undefined) result.javaStringCheckUtf8 = tsValueToJsonValueFns.bool(value.javaStringCheckUtf8);
  if (value.ccEnableArenas !== undefined) result.ccEnableArenas = tsValueToJsonValueFns.bool(value.ccEnableArenas);
  if (value.objcClassPrefix !== undefined) result.objcClassPrefix = tsValueToJsonValueFns.string(value.objcClassPrefix);
  if (value.csharpNamespace !== undefined) result.csharpNamespace = tsValueToJsonValueFns.string(value.csharpNamespace);
  if (value.swiftPrefix !== undefined) result.swiftPrefix = tsValueToJsonValueFns.string(value.swiftPrefix);
  if (value.phpClassPrefix !== undefined) result.phpClassPrefix = tsValueToJsonValueFns.string(value.phpClassPrefix);
  if (value.phpNamespace !== undefined) result.phpNamespace = tsValueToJsonValueFns.string(value.phpNamespace);
  if (value.phpGenericServices !== undefined) result.phpGenericServices = tsValueToJsonValueFns.bool(value.phpGenericServices);
  if (value.phpMetadataNamespace !== undefined) result.phpMetadataNamespace = tsValueToJsonValueFns.string(value.phpMetadataNamespace);
  if (value.rubyPackage !== undefined) result.rubyPackage = tsValueToJsonValueFns.string(value.rubyPackage);
  result.uninterpretedOption = value.uninterpretedOption.map(value => encodeJson_1(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FileOptions {
  const result = getDefaultValue();
  if (value.javaPackage !== undefined) result.javaPackage = jsonValueToTsValueFns.string(value.javaPackage);
  if (value.javaOuterClassname !== undefined) result.javaOuterClassname = jsonValueToTsValueFns.string(value.javaOuterClassname);
  if (value.optimizeFor !== undefined) result.optimizeFor = jsonValueToTsValueFns.enum(value.optimizeFor) as OptimizeMode;
  if (value.javaMultipleFiles !== undefined) result.javaMultipleFiles = jsonValueToTsValueFns.bool(value.javaMultipleFiles);
  if (value.goPackage !== undefined) result.goPackage = jsonValueToTsValueFns.string(value.goPackage);
  if (value.ccGenericServices !== undefined) result.ccGenericServices = jsonValueToTsValueFns.bool(value.ccGenericServices);
  if (value.javaGenericServices !== undefined) result.javaGenericServices = jsonValueToTsValueFns.bool(value.javaGenericServices);
  if (value.pyGenericServices !== undefined) result.pyGenericServices = jsonValueToTsValueFns.bool(value.pyGenericServices);
  if (value.javaGenerateEqualsAndHash !== undefined) result.javaGenerateEqualsAndHash = jsonValueToTsValueFns.bool(value.javaGenerateEqualsAndHash);
  if (value.deprecated !== undefined) result.deprecated = jsonValueToTsValueFns.bool(value.deprecated);
  if (value.javaStringCheckUtf8 !== undefined) result.javaStringCheckUtf8 = jsonValueToTsValueFns.bool(value.javaStringCheckUtf8);
  if (value.ccEnableArenas !== undefined) result.ccEnableArenas = jsonValueToTsValueFns.bool(value.ccEnableArenas);
  if (value.objcClassPrefix !== undefined) result.objcClassPrefix = jsonValueToTsValueFns.string(value.objcClassPrefix);
  if (value.csharpNamespace !== undefined) result.csharpNamespace = jsonValueToTsValueFns.string(value.csharpNamespace);
  if (value.swiftPrefix !== undefined) result.swiftPrefix = jsonValueToTsValueFns.string(value.swiftPrefix);
  if (value.phpClassPrefix !== undefined) result.phpClassPrefix = jsonValueToTsValueFns.string(value.phpClassPrefix);
  if (value.phpNamespace !== undefined) result.phpNamespace = jsonValueToTsValueFns.string(value.phpNamespace);
  if (value.phpGenericServices !== undefined) result.phpGenericServices = jsonValueToTsValueFns.bool(value.phpGenericServices);
  if (value.phpMetadataNamespace !== undefined) result.phpMetadataNamespace = jsonValueToTsValueFns.string(value.phpMetadataNamespace);
  if (value.rubyPackage !== undefined) result.rubyPackage = jsonValueToTsValueFns.string(value.rubyPackage);
  result.uninterpretedOption = value.uninterpretedOption.map((value: any) => decodeJson_1(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.FileOptions): Uint8Array {
  const result: WireMessage = [];
  if (value.javaPackage !== undefined) {
    const tsValue = value.javaPackage;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.javaOuterClassname !== undefined) {
    const tsValue = value.javaOuterClassname;
    result.push(
      [8, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.optimizeFor !== undefined) {
    const tsValue = value.optimizeFor;
    result.push(
      [9, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  if (value.javaMultipleFiles !== undefined) {
    const tsValue = value.javaMultipleFiles;
    result.push(
      [10, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.goPackage !== undefined) {
    const tsValue = value.goPackage;
    result.push(
      [11, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.ccGenericServices !== undefined) {
    const tsValue = value.ccGenericServices;
    result.push(
      [16, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.javaGenericServices !== undefined) {
    const tsValue = value.javaGenericServices;
    result.push(
      [17, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.pyGenericServices !== undefined) {
    const tsValue = value.pyGenericServices;
    result.push(
      [18, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.javaGenerateEqualsAndHash !== undefined) {
    const tsValue = value.javaGenerateEqualsAndHash;
    result.push(
      [20, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.deprecated !== undefined) {
    const tsValue = value.deprecated;
    result.push(
      [23, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.javaStringCheckUtf8 !== undefined) {
    const tsValue = value.javaStringCheckUtf8;
    result.push(
      [27, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.ccEnableArenas !== undefined) {
    const tsValue = value.ccEnableArenas;
    result.push(
      [31, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.objcClassPrefix !== undefined) {
    const tsValue = value.objcClassPrefix;
    result.push(
      [36, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.csharpNamespace !== undefined) {
    const tsValue = value.csharpNamespace;
    result.push(
      [37, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.swiftPrefix !== undefined) {
    const tsValue = value.swiftPrefix;
    result.push(
      [39, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.phpClassPrefix !== undefined) {
    const tsValue = value.phpClassPrefix;
    result.push(
      [40, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.phpNamespace !== undefined) {
    const tsValue = value.phpNamespace;
    result.push(
      [41, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.phpGenericServices !== undefined) {
    const tsValue = value.phpGenericServices;
    result.push(
      [42, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.phpMetadataNamespace !== undefined) {
    const tsValue = value.phpMetadataNamespace;
    result.push(
      [44, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.rubyPackage !== undefined) {
    const tsValue = value.rubyPackage;
    result.push(
      [45, tsValueToWireValueFns.string(tsValue)],
    );
  }
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FileOptions {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.javaPackage = value;
  }
  field: {
    const wireValue = wireFields.get(8);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.javaOuterClassname = value;
  }
  field: {
    const wireValue = wireFields.get(9);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.optimizeFor = value;
  }
  field: {
    const wireValue = wireFields.get(10);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.javaMultipleFiles = value;
  }
  field: {
    const wireValue = wireFields.get(11);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.goPackage = value;
  }
  field: {
    const wireValue = wireFields.get(16);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.ccGenericServices = value;
  }
  field: {
    const wireValue = wireFields.get(17);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.javaGenericServices = value;
  }
  field: {
    const wireValue = wireFields.get(18);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.pyGenericServices = value;
  }
  field: {
    const wireValue = wireFields.get(20);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.javaGenerateEqualsAndHash = value;
  }
  field: {
    const wireValue = wireFields.get(23);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.deprecated = value;
  }
  field: {
    const wireValue = wireFields.get(27);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.javaStringCheckUtf8 = value;
  }
  field: {
    const wireValue = wireFields.get(31);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.ccEnableArenas = value;
  }
  field: {
    const wireValue = wireFields.get(36);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.objcClassPrefix = value;
  }
  field: {
    const wireValue = wireFields.get(37);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.csharpNamespace = value;
  }
  field: {
    const wireValue = wireFields.get(39);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.swiftPrefix = value;
  }
  field: {
    const wireValue = wireFields.get(40);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.phpClassPrefix = value;
  }
  field: {
    const wireValue = wireFields.get(41);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.phpNamespace = value;
  }
  field: {
    const wireValue = wireFields.get(42);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.phpGenericServices = value;
  }
  field: {
    const wireValue = wireFields.get(44);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.phpMetadataNamespace = value;
  }
  field: {
    const wireValue = wireFields.get(45);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.rubyPackage = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 999).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.uninterpretedOption = value as any;
  }
  return result;
}
