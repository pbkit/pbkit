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

export declare namespace $.google.protobuf.compiler {
  export interface Version {
    major?: number;
    minor?: number;
    patch?: number;
    suffix?: string;
  }
}
export type Type = $.google.protobuf.compiler.Version;

export function getDefaultValue(): $.google.protobuf.compiler.Version {
  return {
    major: 0,
    minor: 0,
    patch: 0,
    suffix: "",
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.compiler.Version>): $.google.protobuf.compiler.Version {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.compiler.Version): unknown {
  const result: any = {};
  if (value.major !== undefined) result.major = tsValueToJsonValueFns.int32(value.major);
  if (value.minor !== undefined) result.minor = tsValueToJsonValueFns.int32(value.minor);
  if (value.patch !== undefined) result.patch = tsValueToJsonValueFns.int32(value.patch);
  if (value.suffix !== undefined) result.suffix = tsValueToJsonValueFns.string(value.suffix);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.compiler.Version {
  const result = getDefaultValue();
  if (value.major !== undefined) result.major = jsonValueToTsValueFns.int32(value.major);
  if (value.minor !== undefined) result.minor = jsonValueToTsValueFns.int32(value.minor);
  if (value.patch !== undefined) result.patch = jsonValueToTsValueFns.int32(value.patch);
  if (value.suffix !== undefined) result.suffix = jsonValueToTsValueFns.string(value.suffix);
  return result;
}

export function encodeBinary(value: $.google.protobuf.compiler.Version): Uint8Array {
  const result: WireMessage = [];
  if (value.major !== undefined) {
    const tsValue = value.major;
    result.push(
      [1, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.minor !== undefined) {
    const tsValue = value.minor;
    result.push(
      [2, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.patch !== undefined) {
    const tsValue = value.patch;
    result.push(
      [3, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.suffix !== undefined) {
    const tsValue = value.suffix;
    result.push(
      [4, tsValueToWireValueFns.string(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.compiler.Version {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.major = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.minor = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.patch = value;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.suffix = value;
  }
  return result;
}
