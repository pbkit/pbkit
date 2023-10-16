// @ts-nocheck
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

export declare namespace $.google.protobuf.ExtensionRangeOptions {
  export type Declaration = {
    number?: number;
    fullName?: string;
    type?: string;
    reserved?: boolean;
    repeated?: boolean;
  }
}

export type Type = $.google.protobuf.ExtensionRangeOptions.Declaration;

export function getDefaultValue(): $.google.protobuf.ExtensionRangeOptions.Declaration {
  return {
    number: undefined,
    fullName: undefined,
    type: undefined,
    reserved: undefined,
    repeated: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.ExtensionRangeOptions.Declaration>): $.google.protobuf.ExtensionRangeOptions.Declaration {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.ExtensionRangeOptions.Declaration): unknown {
  const result: any = {};
  if (value.number !== undefined) result.number = tsValueToJsonValueFns.int32(value.number);
  if (value.fullName !== undefined) result.fullName = tsValueToJsonValueFns.string(value.fullName);
  if (value.type !== undefined) result.type = tsValueToJsonValueFns.string(value.type);
  if (value.reserved !== undefined) result.reserved = tsValueToJsonValueFns.bool(value.reserved);
  if (value.repeated !== undefined) result.repeated = tsValueToJsonValueFns.bool(value.repeated);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.ExtensionRangeOptions.Declaration {
  const result = getDefaultValue();
  if (value.number !== undefined) result.number = jsonValueToTsValueFns.int32(value.number);
  if (value.fullName !== undefined) result.fullName = jsonValueToTsValueFns.string(value.fullName);
  if (value.type !== undefined) result.type = jsonValueToTsValueFns.string(value.type);
  if (value.reserved !== undefined) result.reserved = jsonValueToTsValueFns.bool(value.reserved);
  if (value.repeated !== undefined) result.repeated = jsonValueToTsValueFns.bool(value.repeated);
  return result;
}

export function encodeBinary(value: $.google.protobuf.ExtensionRangeOptions.Declaration): Uint8Array {
  const result: WireMessage = [];
  if (value.number !== undefined) {
    const tsValue = value.number;
    result.push(
      [1, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.fullName !== undefined) {
    const tsValue = value.fullName;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.type !== undefined) {
    const tsValue = value.type;
    result.push(
      [3, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.reserved !== undefined) {
    const tsValue = value.reserved;
    result.push(
      [5, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.repeated !== undefined) {
    const tsValue = value.repeated;
    result.push(
      [6, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.ExtensionRangeOptions.Declaration {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.number = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.fullName = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.type = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.reserved = value;
  }
  field: {
    const wireValue = wireFields.get(6);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.repeated = value;
  }
  return result;
}
