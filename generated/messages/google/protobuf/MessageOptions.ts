import {
  Type as UninterpretedOption,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./UninterpretedOption.ts";
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
  export interface MessageOptions {
    messageSetWireFormat?: boolean;
    noStandardDescriptorAccessor?: boolean;
    deprecated?: boolean;
    mapEntry?: boolean;
    uninterpretedOption: UninterpretedOption[];
  }
}
export type Type = $.google.protobuf.MessageOptions;

export function getDefaultValue(): $.google.protobuf.MessageOptions {
  return {
    messageSetWireFormat: false,
    noStandardDescriptorAccessor: false,
    deprecated: false,
    mapEntry: false,
    uninterpretedOption: [],
  };
}

export function encodeJson(value: $.google.protobuf.MessageOptions): unknown {
  const result: any = {};
  if (value.messageSetWireFormat !== undefined) result.messageSetWireFormat = tsValueToJsonValueFns.bool(value.messageSetWireFormat);
  if (value.noStandardDescriptorAccessor !== undefined) result.noStandardDescriptorAccessor = tsValueToJsonValueFns.bool(value.noStandardDescriptorAccessor);
  if (value.deprecated !== undefined) result.deprecated = tsValueToJsonValueFns.bool(value.deprecated);
  if (value.mapEntry !== undefined) result.mapEntry = tsValueToJsonValueFns.bool(value.mapEntry);
  result.uninterpretedOption = value.uninterpretedOption.map(value => encodeJson_1(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.MessageOptions {
  const result = getDefaultValue();
  if (value.messageSetWireFormat !== undefined) result.messageSetWireFormat = jsonValueToTsValueFns.bool(value.messageSetWireFormat);
  if (value.noStandardDescriptorAccessor !== undefined) result.noStandardDescriptorAccessor = jsonValueToTsValueFns.bool(value.noStandardDescriptorAccessor);
  if (value.deprecated !== undefined) result.deprecated = jsonValueToTsValueFns.bool(value.deprecated);
  if (value.mapEntry !== undefined) result.mapEntry = jsonValueToTsValueFns.bool(value.mapEntry);
  result.uninterpretedOption = value.uninterpretedOption.map((value: any) => decodeJson_1(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.MessageOptions): Uint8Array {
  const result: WireMessage = [];
  if (value.messageSetWireFormat !== undefined) {
    const tsValue = value.messageSetWireFormat;
    result.push(
      [1, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.noStandardDescriptorAccessor !== undefined) {
    const tsValue = value.noStandardDescriptorAccessor;
    result.push(
      [2, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.deprecated !== undefined) {
    const tsValue = value.deprecated;
    result.push(
      [3, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.mapEntry !== undefined) {
    const tsValue = value.mapEntry;
    result.push(
      [7, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.MessageOptions {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.messageSetWireFormat = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.noStandardDescriptorAccessor = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.deprecated = value;
  }
  field: {
    const wireValue = wireFields.get(7);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.mapEntry = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 999).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.uninterpretedOption = value as any;
  }
  return result;
}
