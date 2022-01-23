import {
  Type as Label,
  name2num,
  num2name,
} from "./(FieldDescriptorProto)/Label.ts";
import {
  Type as Type_1,
  name2num as name2num_1,
  num2name as num2name_1,
} from "./(FieldDescriptorProto)/Type.ts";
import {
  Type as FieldOptions,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./FieldOptions.ts";
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
  default as Long,
} from "../../../../core/runtime/Long.ts";
import {
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf {
  export interface FieldDescriptorProto {
    name?: string;
    extendee?: string;
    number?: number;
    label?: Label;
    type?: Type_1;
    typeName?: string;
    defaultValue?: string;
    options?: FieldOptions;
    oneofIndex?: number;
    jsonName?: string;
    proto3Optional?: boolean;
  }
}
export type Type = $.google.protobuf.FieldDescriptorProto;

export function getDefaultValue(): $.google.protobuf.FieldDescriptorProto {
  return {
    name: "",
    extendee: "",
    number: 0,
    label: "UNSPECIFIED",
    type: "UNSPECIFIED",
    typeName: "",
    defaultValue: "",
    options: undefined,
    oneofIndex: 0,
    jsonName: "",
    proto3Optional: false,
  };
}

export function encodeJson(value: $.google.protobuf.FieldDescriptorProto): unknown {
  const result: any = {};
  if (value.name !== undefined) result.name = tsValueToJsonValueFns.string(value.name);
  if (value.extendee !== undefined) result.extendee = tsValueToJsonValueFns.string(value.extendee);
  if (value.number !== undefined) result.number = tsValueToJsonValueFns.int32(value.number);
  if (value.label !== undefined) result.label = tsValueToJsonValueFns.enum(value.label);
  if (value.type !== undefined) result.type = tsValueToJsonValueFns.enum(value.type);
  if (value.typeName !== undefined) result.typeName = tsValueToJsonValueFns.string(value.typeName);
  if (value.defaultValue !== undefined) result.defaultValue = tsValueToJsonValueFns.string(value.defaultValue);
  if (value.options !== undefined) result.options = encodeJson_1(value.options);
  if (value.oneofIndex !== undefined) result.oneofIndex = tsValueToJsonValueFns.int32(value.oneofIndex);
  if (value.jsonName !== undefined) result.jsonName = tsValueToJsonValueFns.string(value.jsonName);
  if (value.proto3Optional !== undefined) result.proto3Optional = tsValueToJsonValueFns.bool(value.proto3Optional);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FieldDescriptorProto {
  const result = getDefaultValue();
  if (value.name !== undefined) result.name = jsonValueToTsValueFns.string(value.name);
  if (value.extendee !== undefined) result.extendee = jsonValueToTsValueFns.string(value.extendee);
  if (value.number !== undefined) result.number = jsonValueToTsValueFns.int32(value.number);
  if (value.label !== undefined) result.label = jsonValueToTsValueFns.enum(value.label) as Label;
  if (value.type !== undefined) result.type = jsonValueToTsValueFns.enum(value.type) as Type_1;
  if (value.typeName !== undefined) result.typeName = jsonValueToTsValueFns.string(value.typeName);
  if (value.defaultValue !== undefined) result.defaultValue = jsonValueToTsValueFns.string(value.defaultValue);
  if (value.options !== undefined) result.options = decodeJson_1(value.options);
  if (value.oneofIndex !== undefined) result.oneofIndex = jsonValueToTsValueFns.int32(value.oneofIndex);
  if (value.jsonName !== undefined) result.jsonName = jsonValueToTsValueFns.string(value.jsonName);
  if (value.proto3Optional !== undefined) result.proto3Optional = jsonValueToTsValueFns.bool(value.proto3Optional);
  return result;
}

export function encodeBinary(value: $.google.protobuf.FieldDescriptorProto): Uint8Array {
  const result: WireMessage = [];
  if (value.name !== undefined) {
    const tsValue = value.name;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.extendee !== undefined) {
    const tsValue = value.extendee;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.number !== undefined) {
    const tsValue = value.number;
    result.push(
      [3, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.label !== undefined) {
    const tsValue = value.label;
    result.push(
      [4, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  if (value.type !== undefined) {
    const tsValue = value.type;
    result.push(
      [5, { type: WireType.Varint as const, value: new Long(name2num_1[tsValue as keyof typeof name2num_1]) }],
    );
  }
  if (value.typeName !== undefined) {
    const tsValue = value.typeName;
    result.push(
      [6, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.defaultValue !== undefined) {
    const tsValue = value.defaultValue;
    result.push(
      [7, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.options !== undefined) {
    const tsValue = value.options;
    result.push(
      [8, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.oneofIndex !== undefined) {
    const tsValue = value.oneofIndex;
    result.push(
      [9, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.jsonName !== undefined) {
    const tsValue = value.jsonName;
    result.push(
      [10, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.proto3Optional !== undefined) {
    const tsValue = value.proto3Optional;
    result.push(
      [17, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FieldDescriptorProto {
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
    result.extendee = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.number = value;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.label = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_1[wireValue.value[0] as keyof typeof num2name_1] : undefined;
    if (value === undefined) break field;
    result.type = value;
  }
  field: {
    const wireValue = wireFields.get(6);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.typeName = value;
  }
  field: {
    const wireValue = wireFields.get(7);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.defaultValue = value;
  }
  field: {
    const wireValue = wireFields.get(8);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.options = value;
  }
  field: {
    const wireValue = wireFields.get(9);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.oneofIndex = value;
  }
  field: {
    const wireValue = wireFields.get(10);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.jsonName = value;
  }
  field: {
    const wireValue = wireFields.get(17);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.proto3Optional = value;
  }
  return result;
}
