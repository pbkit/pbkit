// @ts-nocheck
import {
  Type as NamePart,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./(UninterpretedOption)/NamePart.ts";
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
  export type UninterpretedOption = {
    name: NamePart[];
    identifierValue?: string;
    positiveIntValue?: string;
    negativeIntValue?: string;
    doubleValue?: number;
    stringValue?: Uint8Array;
    aggregateValue?: string;
  }
}

export type Type = $.google.protobuf.UninterpretedOption;

export function getDefaultValue(): $.google.protobuf.UninterpretedOption {
  return {
    name: [],
    identifierValue: undefined,
    positiveIntValue: undefined,
    negativeIntValue: undefined,
    doubleValue: undefined,
    stringValue: undefined,
    aggregateValue: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.UninterpretedOption>): $.google.protobuf.UninterpretedOption {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.UninterpretedOption): unknown {
  const result: any = {};
  result.name = value.name.map(value => encodeJson_1(value));
  if (value.identifierValue !== undefined) result.identifierValue = tsValueToJsonValueFns.string(value.identifierValue);
  if (value.positiveIntValue !== undefined) result.positiveIntValue = tsValueToJsonValueFns.uint64(value.positiveIntValue);
  if (value.negativeIntValue !== undefined) result.negativeIntValue = tsValueToJsonValueFns.int64(value.negativeIntValue);
  if (value.doubleValue !== undefined) result.doubleValue = tsValueToJsonValueFns.double(value.doubleValue);
  if (value.stringValue !== undefined) result.stringValue = tsValueToJsonValueFns.bytes(value.stringValue);
  if (value.aggregateValue !== undefined) result.aggregateValue = tsValueToJsonValueFns.string(value.aggregateValue);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.UninterpretedOption {
  const result = getDefaultValue();
  result.name = value.name?.map((value: any) => decodeJson_1(value)) ?? [];
  if (value.identifierValue !== undefined) result.identifierValue = jsonValueToTsValueFns.string(value.identifierValue);
  if (value.positiveIntValue !== undefined) result.positiveIntValue = jsonValueToTsValueFns.uint64(value.positiveIntValue);
  if (value.negativeIntValue !== undefined) result.negativeIntValue = jsonValueToTsValueFns.int64(value.negativeIntValue);
  if (value.doubleValue !== undefined) result.doubleValue = jsonValueToTsValueFns.double(value.doubleValue);
  if (value.stringValue !== undefined) result.stringValue = jsonValueToTsValueFns.bytes(value.stringValue);
  if (value.aggregateValue !== undefined) result.aggregateValue = jsonValueToTsValueFns.string(value.aggregateValue);
  return result;
}

export function encodeBinary(value: $.google.protobuf.UninterpretedOption): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.name) {
    result.push(
      [2, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.identifierValue !== undefined) {
    const tsValue = value.identifierValue;
    result.push(
      [3, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.positiveIntValue !== undefined) {
    const tsValue = value.positiveIntValue;
    result.push(
      [4, tsValueToWireValueFns.uint64(tsValue)],
    );
  }
  if (value.negativeIntValue !== undefined) {
    const tsValue = value.negativeIntValue;
    result.push(
      [5, tsValueToWireValueFns.int64(tsValue)],
    );
  }
  if (value.doubleValue !== undefined) {
    const tsValue = value.doubleValue;
    result.push(
      [6, tsValueToWireValueFns.double(tsValue)],
    );
  }
  if (value.stringValue !== undefined) {
    const tsValue = value.stringValue;
    result.push(
      [7, tsValueToWireValueFns.bytes(tsValue)],
    );
  }
  if (value.aggregateValue !== undefined) {
    const tsValue = value.aggregateValue;
    result.push(
      [8, tsValueToWireValueFns.string(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.UninterpretedOption {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 2).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.name = value as any;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.identifierValue = value;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.uint64(wireValue);
    if (value === undefined) break field;
    result.positiveIntValue = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int64(wireValue);
    if (value === undefined) break field;
    result.negativeIntValue = value;
  }
  field: {
    const wireValue = wireFields.get(6);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.double(wireValue);
    if (value === undefined) break field;
    result.doubleValue = value;
  }
  field: {
    const wireValue = wireFields.get(7);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bytes(wireValue);
    if (value === undefined) break field;
    result.stringValue = value;
  }
  field: {
    const wireValue = wireFields.get(8);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.aggregateValue = value;
  }
  return result;
}
