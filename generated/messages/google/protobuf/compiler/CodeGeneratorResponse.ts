import {
  Type as File,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./(CodeGeneratorResponse)/File.ts";
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
  export interface CodeGeneratorResponse {
    error?: string;
    supportedFeatures?: string;
    file: File[];
  }
}
export type Type = $.google.protobuf.compiler.CodeGeneratorResponse;

export function getDefaultValue(): $.google.protobuf.compiler.CodeGeneratorResponse {
  return {
    error: "",
    supportedFeatures: "0",
    file: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.compiler.CodeGeneratorResponse>): $.google.protobuf.compiler.CodeGeneratorResponse {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.compiler.CodeGeneratorResponse): unknown {
  const result: any = {};
  if (value.error !== undefined) result.error = tsValueToJsonValueFns.string(value.error);
  if (value.supportedFeatures !== undefined) result.supportedFeatures = tsValueToJsonValueFns.uint64(value.supportedFeatures);
  result.file = value.file.map(value => encodeJson_1(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.compiler.CodeGeneratorResponse {
  const result = getDefaultValue();
  if (value.error !== undefined) result.error = jsonValueToTsValueFns.string(value.error);
  if (value.supportedFeatures !== undefined) result.supportedFeatures = jsonValueToTsValueFns.uint64(value.supportedFeatures);
  result.file = value.file?.map((value: any) => decodeJson_1(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.compiler.CodeGeneratorResponse): Uint8Array {
  const result: WireMessage = [];
  if (value.error !== undefined) {
    const tsValue = value.error;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.supportedFeatures !== undefined) {
    const tsValue = value.supportedFeatures;
    result.push(
      [2, tsValueToWireValueFns.uint64(tsValue)],
    );
  }
  for (const tsValue of value.file) {
    result.push(
      [15, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.compiler.CodeGeneratorResponse {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.error = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.uint64(wireValue);
    if (value === undefined) break field;
    result.supportedFeatures = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 15).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.file = value as any;
  }
  return result;
}
