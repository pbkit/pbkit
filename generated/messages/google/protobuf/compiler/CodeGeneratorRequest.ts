import {
  Type as Version,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./Version.ts";
import {
  Type as FileDescriptorProto,
  encodeJson as encodeJson_2,
  decodeJson as decodeJson_2,
  encodeBinary as encodeBinary_2,
  decodeBinary as decodeBinary_2,
} from "../FileDescriptorProto.ts";
import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../../../../../core/runtime/json/scalar.ts";
import {
  WireMessage,
  WireType,
} from "../../../../../core/runtime/wire/index.ts";
import {
  default as serialize,
} from "../../../../../core/runtime/wire/serialize.ts";
import {
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../../../../../core/runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf.compiler {
  export interface CodeGeneratorRequest {
    fileToGenerate: string[];
    parameter?: string;
    compilerVersion?: Version;
    protoFile: FileDescriptorProto[];
  }
}
export type Type = $.google.protobuf.compiler.CodeGeneratorRequest;

export function getDefaultValue(): $.google.protobuf.compiler.CodeGeneratorRequest {
  return {
    fileToGenerate: [],
    parameter: "",
    compilerVersion: undefined,
    protoFile: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.compiler.CodeGeneratorRequest>): $.google.protobuf.compiler.CodeGeneratorRequest {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.compiler.CodeGeneratorRequest): unknown {
  const result: any = {};
  result.fileToGenerate = value.fileToGenerate.map(value => tsValueToJsonValueFns.string(value));
  if (value.parameter !== undefined) result.parameter = tsValueToJsonValueFns.string(value.parameter);
  if (value.compilerVersion !== undefined) result.compilerVersion = encodeJson_1(value.compilerVersion);
  result.protoFile = value.protoFile.map(value => encodeJson_2(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.compiler.CodeGeneratorRequest {
  const result = getDefaultValue();
  result.fileToGenerate = value.fileToGenerate?.map((value: any) => jsonValueToTsValueFns.string(value)) ?? [];
  if (value.parameter !== undefined) result.parameter = jsonValueToTsValueFns.string(value.parameter);
  if (value.compilerVersion !== undefined) result.compilerVersion = decodeJson_1(value.compilerVersion);
  result.protoFile = value.protoFile?.map((value: any) => decodeJson_2(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.compiler.CodeGeneratorRequest): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.fileToGenerate) {
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.parameter !== undefined) {
    const tsValue = value.parameter;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.compilerVersion !== undefined) {
    const tsValue = value.compilerVersion;
    result.push(
      [3, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  for (const tsValue of value.protoFile) {
    result.push(
      [15, { type: WireType.LengthDelimited as const, value: encodeBinary_2(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.compiler.CodeGeneratorRequest {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValueToTsValueFns.string(wireValue)).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.fileToGenerate = value as any;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.parameter = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.compilerVersion = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 15).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_2(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.protoFile = value as any;
  }
  return result;
}
