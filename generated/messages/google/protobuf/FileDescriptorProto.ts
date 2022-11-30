import {
  Type as DescriptorProto,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./DescriptorProto.ts";
import {
  Type as EnumDescriptorProto,
  encodeJson as encodeJson_2,
  decodeJson as decodeJson_2,
  encodeBinary as encodeBinary_2,
  decodeBinary as decodeBinary_2,
} from "./EnumDescriptorProto.ts";
import {
  Type as ServiceDescriptorProto,
  encodeJson as encodeJson_3,
  decodeJson as decodeJson_3,
  encodeBinary as encodeBinary_3,
  decodeBinary as decodeBinary_3,
} from "./ServiceDescriptorProto.ts";
import {
  Type as FieldDescriptorProto,
  encodeJson as encodeJson_4,
  decodeJson as decodeJson_4,
  encodeBinary as encodeBinary_4,
  decodeBinary as decodeBinary_4,
} from "./FieldDescriptorProto.ts";
import {
  Type as FileOptions,
  encodeJson as encodeJson_5,
  decodeJson as decodeJson_5,
  encodeBinary as encodeBinary_5,
  decodeBinary as decodeBinary_5,
} from "./FileOptions.ts";
import {
  Type as SourceCodeInfo,
  encodeJson as encodeJson_6,
  decodeJson as decodeJson_6,
  encodeBinary as encodeBinary_6,
  decodeBinary as decodeBinary_6,
} from "./SourceCodeInfo.ts";
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
  unpackFns,
} from "../../../../core/runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf {
  export type FileDescriptorProto = {
    name?: string;
    package?: string;
    dependency: string[];
    messageType: DescriptorProto[];
    enumType: EnumDescriptorProto[];
    service: ServiceDescriptorProto[];
    extension: FieldDescriptorProto[];
    options?: FileOptions;
    sourceCodeInfo?: SourceCodeInfo;
    publicDependency: number[];
    weakDependency: number[];
    syntax?: string;
    edition?: string;
  }
}

export type Type = $.google.protobuf.FileDescriptorProto;

export function getDefaultValue(): $.google.protobuf.FileDescriptorProto {
  return {
    name: undefined,
    package: undefined,
    dependency: [],
    messageType: [],
    enumType: [],
    service: [],
    extension: [],
    options: undefined,
    sourceCodeInfo: undefined,
    publicDependency: [],
    weakDependency: [],
    syntax: undefined,
    edition: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.FileDescriptorProto>): $.google.protobuf.FileDescriptorProto {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.FileDescriptorProto): unknown {
  const result: any = {};
  if (value.name !== undefined) result.name = tsValueToJsonValueFns.string(value.name);
  if (value.package !== undefined) result.package = tsValueToJsonValueFns.string(value.package);
  result.dependency = value.dependency.map(value => tsValueToJsonValueFns.string(value));
  result.messageType = value.messageType.map(value => encodeJson_1(value));
  result.enumType = value.enumType.map(value => encodeJson_2(value));
  result.service = value.service.map(value => encodeJson_3(value));
  result.extension = value.extension.map(value => encodeJson_4(value));
  if (value.options !== undefined) result.options = encodeJson_5(value.options);
  if (value.sourceCodeInfo !== undefined) result.sourceCodeInfo = encodeJson_6(value.sourceCodeInfo);
  result.publicDependency = value.publicDependency.map(value => tsValueToJsonValueFns.int32(value));
  result.weakDependency = value.weakDependency.map(value => tsValueToJsonValueFns.int32(value));
  if (value.syntax !== undefined) result.syntax = tsValueToJsonValueFns.string(value.syntax);
  if (value.edition !== undefined) result.edition = tsValueToJsonValueFns.string(value.edition);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FileDescriptorProto {
  const result = getDefaultValue();
  if (value.name !== undefined) result.name = jsonValueToTsValueFns.string(value.name);
  if (value.package !== undefined) result.package = jsonValueToTsValueFns.string(value.package);
  result.dependency = value.dependency?.map((value: any) => jsonValueToTsValueFns.string(value)) ?? [];
  result.messageType = value.messageType?.map((value: any) => decodeJson_1(value)) ?? [];
  result.enumType = value.enumType?.map((value: any) => decodeJson_2(value)) ?? [];
  result.service = value.service?.map((value: any) => decodeJson_3(value)) ?? [];
  result.extension = value.extension?.map((value: any) => decodeJson_4(value)) ?? [];
  if (value.options !== undefined) result.options = decodeJson_5(value.options);
  if (value.sourceCodeInfo !== undefined) result.sourceCodeInfo = decodeJson_6(value.sourceCodeInfo);
  result.publicDependency = value.publicDependency?.map((value: any) => jsonValueToTsValueFns.int32(value)) ?? [];
  result.weakDependency = value.weakDependency?.map((value: any) => jsonValueToTsValueFns.int32(value)) ?? [];
  if (value.syntax !== undefined) result.syntax = jsonValueToTsValueFns.string(value.syntax);
  if (value.edition !== undefined) result.edition = jsonValueToTsValueFns.string(value.edition);
  return result;
}

export function encodeBinary(value: $.google.protobuf.FileDescriptorProto): Uint8Array {
  const result: WireMessage = [];
  if (value.name !== undefined) {
    const tsValue = value.name;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.package !== undefined) {
    const tsValue = value.package;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
    );
  }
  for (const tsValue of value.dependency) {
    result.push(
      [3, tsValueToWireValueFns.string(tsValue)],
    );
  }
  for (const tsValue of value.messageType) {
    result.push(
      [4, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  for (const tsValue of value.enumType) {
    result.push(
      [5, { type: WireType.LengthDelimited as const, value: encodeBinary_2(tsValue) }],
    );
  }
  for (const tsValue of value.service) {
    result.push(
      [6, { type: WireType.LengthDelimited as const, value: encodeBinary_3(tsValue) }],
    );
  }
  for (const tsValue of value.extension) {
    result.push(
      [7, { type: WireType.LengthDelimited as const, value: encodeBinary_4(tsValue) }],
    );
  }
  if (value.options !== undefined) {
    const tsValue = value.options;
    result.push(
      [8, { type: WireType.LengthDelimited as const, value: encodeBinary_5(tsValue) }],
    );
  }
  if (value.sourceCodeInfo !== undefined) {
    const tsValue = value.sourceCodeInfo;
    result.push(
      [9, { type: WireType.LengthDelimited as const, value: encodeBinary_6(tsValue) }],
    );
  }
  for (const tsValue of value.publicDependency) {
    result.push(
      [10, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  for (const tsValue of value.weakDependency) {
    result.push(
      [11, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.syntax !== undefined) {
    const tsValue = value.syntax;
    result.push(
      [12, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.edition !== undefined) {
    const tsValue = value.edition;
    result.push(
      [13, tsValueToWireValueFns.string(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FileDescriptorProto {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.name = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.package = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 3).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValueToTsValueFns.string(wireValue)).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.dependency = value as any;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 4).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.messageType = value as any;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 5).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_2(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.enumType = value as any;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 6).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_3(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.service = value as any;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 7).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_4(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.extension = value as any;
  }
  field: {
    const wireValue = wireFields.get(8);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_5(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.options = value;
  }
  field: {
    const wireValue = wireFields.get(9);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_6(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.sourceCodeInfo = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 10).map(([, wireValue]) => wireValue);
    const value = Array.from(unpackFns.int32(wireValues));
    if (!value.length) break collection;
    result.publicDependency = value as any;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 11).map(([, wireValue]) => wireValue);
    const value = Array.from(unpackFns.int32(wireValues));
    if (!value.length) break collection;
    result.weakDependency = value as any;
  }
  field: {
    const wireValue = wireFields.get(12);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.syntax = value;
  }
  field: {
    const wireValue = wireFields.get(13);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.edition = value;
  }
  return result;
}
