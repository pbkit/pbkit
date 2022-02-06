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
  unpackFns,
} from "../../../../../core/runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf.SourceCodeInfo {
  export interface Location {
    path: number[];
    span: number[];
    leadingComments?: string;
    trailingComments?: string;
    leadingDetachedComments: string[];
  }
}
export type Type = $.google.protobuf.SourceCodeInfo.Location;

export function getDefaultValue(): $.google.protobuf.SourceCodeInfo.Location {
  return {
    path: [],
    span: [],
    leadingComments: "",
    trailingComments: "",
    leadingDetachedComments: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.SourceCodeInfo.Location>): $.google.protobuf.SourceCodeInfo.Location {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.SourceCodeInfo.Location): unknown {
  const result: any = {};
  result.path = value.path.map(value => tsValueToJsonValueFns.int32(value));
  result.span = value.span.map(value => tsValueToJsonValueFns.int32(value));
  if (value.leadingComments !== undefined) result.leadingComments = tsValueToJsonValueFns.string(value.leadingComments);
  if (value.trailingComments !== undefined) result.trailingComments = tsValueToJsonValueFns.string(value.trailingComments);
  result.leadingDetachedComments = value.leadingDetachedComments.map(value => tsValueToJsonValueFns.string(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.SourceCodeInfo.Location {
  const result = getDefaultValue();
  result.path = value.path.map((value: any) => jsonValueToTsValueFns.int32(value)) ?? [];
  result.span = value.span.map((value: any) => jsonValueToTsValueFns.int32(value)) ?? [];
  if (value.leadingComments !== undefined) result.leadingComments = jsonValueToTsValueFns.string(value.leadingComments);
  if (value.trailingComments !== undefined) result.trailingComments = jsonValueToTsValueFns.string(value.trailingComments);
  result.leadingDetachedComments = value.leadingDetachedComments.map((value: any) => jsonValueToTsValueFns.string(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.SourceCodeInfo.Location): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.path) {
    result.push(
      [1, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  for (const tsValue of value.span) {
    result.push(
      [2, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.leadingComments !== undefined) {
    const tsValue = value.leadingComments;
    result.push(
      [3, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.trailingComments !== undefined) {
    const tsValue = value.trailingComments;
    result.push(
      [4, tsValueToWireValueFns.string(tsValue)],
    );
  }
  for (const tsValue of value.leadingDetachedComments) {
    result.push(
      [6, tsValueToWireValueFns.string(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.SourceCodeInfo.Location {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = Array.from(unpackFns.int32(wireValues));
    if (!value.length) break collection;
    result.path = value as any;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 2).map(([, wireValue]) => wireValue);
    const value = Array.from(unpackFns.int32(wireValues));
    if (!value.length) break collection;
    result.span = value as any;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.leadingComments = value;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.trailingComments = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 6).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValueToTsValueFns.string(wireValue)).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.leadingDetachedComments = value as any;
  }
  return result;
}
