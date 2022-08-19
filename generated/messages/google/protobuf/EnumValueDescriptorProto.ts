import {
  Type as EnumValueOptions,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./EnumValueOptions.ts";
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
  export type EnumValueDescriptorProto = {
    name?: string;
    number?: number;
    options?: EnumValueOptions;
  }
}
export type Type = $.google.protobuf.EnumValueDescriptorProto;

export function getDefaultValue(): $.google.protobuf.EnumValueDescriptorProto {
  return {
    name: "",
    number: 0,
    options: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.EnumValueDescriptorProto>): $.google.protobuf.EnumValueDescriptorProto {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.EnumValueDescriptorProto): unknown {
  const result: any = {};
  if (value.name !== undefined) result.name = tsValueToJsonValueFns.string(value.name);
  if (value.number !== undefined) result.number = tsValueToJsonValueFns.int32(value.number);
  if (value.options !== undefined) result.options = encodeJson_1(value.options);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.EnumValueDescriptorProto {
  const result = getDefaultValue();
  if (value.name !== undefined) result.name = jsonValueToTsValueFns.string(value.name);
  if (value.number !== undefined) result.number = jsonValueToTsValueFns.int32(value.number);
  if (value.options !== undefined) result.options = decodeJson_1(value.options);
  return result;
}

export function encodeBinary(value: $.google.protobuf.EnumValueDescriptorProto): Uint8Array {
  const result: WireMessage = [];
  if (value.name !== undefined) {
    const tsValue = value.name;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.number !== undefined) {
    const tsValue = value.number;
    result.push(
      [2, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.options !== undefined) {
    const tsValue = value.options;
    result.push(
      [3, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.EnumValueDescriptorProto {
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
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.number = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.options = value;
  }
  return result;
}
