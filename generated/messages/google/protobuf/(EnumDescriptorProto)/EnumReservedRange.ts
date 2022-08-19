import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../../../../../core/runtime/json/scalar.ts";
import {
  WireMessage,
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

export declare namespace $.google.protobuf.EnumDescriptorProto {
  export type EnumReservedRange = {
    start?: number;
    end?: number;
  }
}
export type Type = $.google.protobuf.EnumDescriptorProto.EnumReservedRange;

export function getDefaultValue(): $.google.protobuf.EnumDescriptorProto.EnumReservedRange {
  return {
    start: 0,
    end: 0,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.EnumDescriptorProto.EnumReservedRange>): $.google.protobuf.EnumDescriptorProto.EnumReservedRange {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.EnumDescriptorProto.EnumReservedRange): unknown {
  const result: any = {};
  if (value.start !== undefined) result.start = tsValueToJsonValueFns.int32(value.start);
  if (value.end !== undefined) result.end = tsValueToJsonValueFns.int32(value.end);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.EnumDescriptorProto.EnumReservedRange {
  const result = getDefaultValue();
  if (value.start !== undefined) result.start = jsonValueToTsValueFns.int32(value.start);
  if (value.end !== undefined) result.end = jsonValueToTsValueFns.int32(value.end);
  return result;
}

export function encodeBinary(value: $.google.protobuf.EnumDescriptorProto.EnumReservedRange): Uint8Array {
  const result: WireMessage = [];
  if (value.start !== undefined) {
    const tsValue = value.start;
    result.push(
      [1, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.end !== undefined) {
    const tsValue = value.end;
    result.push(
      [2, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.EnumDescriptorProto.EnumReservedRange {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.start = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.end = value;
  }
  return result;
}
