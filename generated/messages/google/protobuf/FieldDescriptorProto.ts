import {
  Type as Label,
  name2num,
  num2name,
} from "./FieldDescriptorProto/Label.ts";
import {
  Type as Type_1,
  name2num as name2num_1,
  num2name as num2name_1,
} from "./FieldDescriptorProto/Type.ts";
import {
  Type as FieldOptions,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./FieldOptions.ts";
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

export interface Type {
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

export function getDefaultValue(): Type {
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

export function encodeBinary(value: Type): Uint8Array {
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
      [4, { type: WireType.Varint as const, value: new Long(name2num[tsValue]) }],
    );
  }
  if (value.type !== undefined) {
    const tsValue = value.type;
    result.push(
      [5, { type: WireType.Varint as const, value: new Long(name2num_1[tsValue]) }],
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

export function decodeBinary(binary: Uint8Array): Type {
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
