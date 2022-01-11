import {
  Type as NamePart,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./(UninterpretedOption)/NamePart.ts";
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

declare namespace $.google.protobuf {
  export interface UninterpretedOption {
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
    identifierValue: "",
    positiveIntValue: "0",
    negativeIntValue: "0",
    doubleValue: 0,
    stringValue: new Uint8Array(),
    aggregateValue: "",
  };
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
