import {
  Type as MethodOptions,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./MethodOptions.ts";
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
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf {
  export interface MethodDescriptorProto {
    name?: string;
    inputType?: string;
    outputType?: string;
    options?: MethodOptions;
    clientStreaming?: boolean;
    serverStreaming?: boolean;
  }
}
export type Type = $.google.protobuf.MethodDescriptorProto;

export function getDefaultValue(): $.google.protobuf.MethodDescriptorProto {
  return {
    name: "",
    inputType: "",
    outputType: "",
    options: undefined,
    clientStreaming: false,
    serverStreaming: false,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.MethodDescriptorProto>): $.google.protobuf.MethodDescriptorProto {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.MethodDescriptorProto): unknown {
  const result: any = {};
  if (value.name !== undefined) result.name = tsValueToJsonValueFns.string(value.name);
  if (value.inputType !== undefined) result.inputType = tsValueToJsonValueFns.string(value.inputType);
  if (value.outputType !== undefined) result.outputType = tsValueToJsonValueFns.string(value.outputType);
  if (value.options !== undefined) result.options = encodeJson_1(value.options);
  if (value.clientStreaming !== undefined) result.clientStreaming = tsValueToJsonValueFns.bool(value.clientStreaming);
  if (value.serverStreaming !== undefined) result.serverStreaming = tsValueToJsonValueFns.bool(value.serverStreaming);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.MethodDescriptorProto {
  const result = getDefaultValue();
  if (value.name !== undefined) result.name = jsonValueToTsValueFns.string(value.name);
  if (value.inputType !== undefined) result.inputType = jsonValueToTsValueFns.string(value.inputType);
  if (value.outputType !== undefined) result.outputType = jsonValueToTsValueFns.string(value.outputType);
  if (value.options !== undefined) result.options = decodeJson_1(value.options);
  if (value.clientStreaming !== undefined) result.clientStreaming = jsonValueToTsValueFns.bool(value.clientStreaming);
  if (value.serverStreaming !== undefined) result.serverStreaming = jsonValueToTsValueFns.bool(value.serverStreaming);
  return result;
}

export function encodeBinary(value: $.google.protobuf.MethodDescriptorProto): Uint8Array {
  const result: WireMessage = [];
  if (value.name !== undefined) {
    const tsValue = value.name;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.inputType !== undefined) {
    const tsValue = value.inputType;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.outputType !== undefined) {
    const tsValue = value.outputType;
    result.push(
      [3, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.options !== undefined) {
    const tsValue = value.options;
    result.push(
      [4, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.clientStreaming !== undefined) {
    const tsValue = value.clientStreaming;
    result.push(
      [5, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.serverStreaming !== undefined) {
    const tsValue = value.serverStreaming;
    result.push(
      [6, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.MethodDescriptorProto {
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
    result.inputType = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.outputType = value;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.options = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.clientStreaming = value;
  }
  field: {
    const wireValue = wireFields.get(6);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.serverStreaming = value;
  }
  return result;
}
