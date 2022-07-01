import {
  Type as GeneratedCodeInfo,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "../../GeneratedCodeInfo.ts";
import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../../../../../../core/runtime/json/scalar.ts";
import {
  WireMessage,
  WireType,
} from "../../../../../../core/runtime/wire/index.ts";
import {
  default as serialize,
} from "../../../../../../core/runtime/wire/serialize.ts";
import {
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../../../../../../core/runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../../../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf.compiler.CodeGeneratorResponse {
  export interface File {
    name?: string;
    insertionPoint?: string;
    content?: string;
    generatedCodeInfo?: GeneratedCodeInfo;
  }
}
export type Type = $.google.protobuf.compiler.CodeGeneratorResponse.File;

export function getDefaultValue(): $.google.protobuf.compiler.CodeGeneratorResponse.File {
  return {
    name: "",
    insertionPoint: "",
    content: "",
    generatedCodeInfo: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.compiler.CodeGeneratorResponse.File>): $.google.protobuf.compiler.CodeGeneratorResponse.File {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.compiler.CodeGeneratorResponse.File): unknown {
  const result: any = {};
  if (value.name !== undefined) result.name = tsValueToJsonValueFns.string(value.name);
  if (value.insertionPoint !== undefined) result.insertionPoint = tsValueToJsonValueFns.string(value.insertionPoint);
  if (value.content !== undefined) result.content = tsValueToJsonValueFns.string(value.content);
  if (value.generatedCodeInfo !== undefined) result.generatedCodeInfo = encodeJson_1(value.generatedCodeInfo);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.compiler.CodeGeneratorResponse.File {
  const result = getDefaultValue();
  if (value.name !== undefined) result.name = jsonValueToTsValueFns.string(value.name);
  if (value.insertionPoint !== undefined) result.insertionPoint = jsonValueToTsValueFns.string(value.insertionPoint);
  if (value.content !== undefined) result.content = jsonValueToTsValueFns.string(value.content);
  if (value.generatedCodeInfo !== undefined) result.generatedCodeInfo = decodeJson_1(value.generatedCodeInfo);
  return result;
}

export function encodeBinary(value: $.google.protobuf.compiler.CodeGeneratorResponse.File): Uint8Array {
  const result: WireMessage = [];
  if (value.name !== undefined) {
    const tsValue = value.name;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.insertionPoint !== undefined) {
    const tsValue = value.insertionPoint;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.content !== undefined) {
    const tsValue = value.content;
    result.push(
      [15, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.generatedCodeInfo !== undefined) {
    const tsValue = value.generatedCodeInfo;
    result.push(
      [16, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.compiler.CodeGeneratorResponse.File {
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
    result.insertionPoint = value;
  }
  field: {
    const wireValue = wireFields.get(15);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.content = value;
  }
  field: {
    const wireValue = wireFields.get(16);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.generatedCodeInfo = value;
  }
  return result;
}
