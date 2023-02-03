// @ts-nocheck
import {
  Type as CType,
  name2num,
  num2name,
} from "./(FieldOptions)/CType.ts";
import {
  Type as JSType,
  name2num as name2num_1,
  num2name as num2name_1,
} from "./(FieldOptions)/JSType.ts";
import {
  Type as OptionRetention,
  name2num as name2num_2,
  num2name as num2name_2,
} from "./(FieldOptions)/OptionRetention.ts";
import {
  Type as OptionTargetType,
  name2num as name2num_3,
  num2name as num2name_3,
} from "./(FieldOptions)/OptionTargetType.ts";
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
  default as Long,
} from "../../../../core/runtime/Long.ts";
import {
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../../../../core/runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf {
  export type FieldOptions = {
    ctype?: CType;
    packed?: boolean;
    deprecated?: boolean;
    lazy?: boolean;
    jstype?: JSType;
    weak?: boolean;
    unverifiedLazy?: boolean;
    debugRedact?: boolean;
    retention?: OptionRetention;
    target?: OptionTargetType;
    uninterpretedOption: UninterpretedOption[];
  }
}

export type Type = $.google.protobuf.FieldOptions;

export function getDefaultValue(): $.google.protobuf.FieldOptions {
  return {
    ctype: undefined,
    packed: undefined,
    deprecated: undefined,
    lazy: undefined,
    jstype: undefined,
    weak: undefined,
    unverifiedLazy: undefined,
    debugRedact: undefined,
    retention: undefined,
    target: undefined,
    uninterpretedOption: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.FieldOptions>): $.google.protobuf.FieldOptions {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.FieldOptions): unknown {
  const result: any = {};
  if (value.ctype !== undefined) result.ctype = tsValueToJsonValueFns.enum(value.ctype);
  if (value.packed !== undefined) result.packed = tsValueToJsonValueFns.bool(value.packed);
  if (value.deprecated !== undefined) result.deprecated = tsValueToJsonValueFns.bool(value.deprecated);
  if (value.lazy !== undefined) result.lazy = tsValueToJsonValueFns.bool(value.lazy);
  if (value.jstype !== undefined) result.jstype = tsValueToJsonValueFns.enum(value.jstype);
  if (value.weak !== undefined) result.weak = tsValueToJsonValueFns.bool(value.weak);
  if (value.unverifiedLazy !== undefined) result.unverifiedLazy = tsValueToJsonValueFns.bool(value.unverifiedLazy);
  if (value.debugRedact !== undefined) result.debugRedact = tsValueToJsonValueFns.bool(value.debugRedact);
  if (value.retention !== undefined) result.retention = tsValueToJsonValueFns.enum(value.retention);
  if (value.target !== undefined) result.target = tsValueToJsonValueFns.enum(value.target);
  result.uninterpretedOption = value.uninterpretedOption.map(value => encodeJson_1(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FieldOptions {
  const result = getDefaultValue();
  if (value.ctype !== undefined) result.ctype = jsonValueToTsValueFns.enum(value.ctype) as CType;
  if (value.packed !== undefined) result.packed = jsonValueToTsValueFns.bool(value.packed);
  if (value.deprecated !== undefined) result.deprecated = jsonValueToTsValueFns.bool(value.deprecated);
  if (value.lazy !== undefined) result.lazy = jsonValueToTsValueFns.bool(value.lazy);
  if (value.jstype !== undefined) result.jstype = jsonValueToTsValueFns.enum(value.jstype) as JSType;
  if (value.weak !== undefined) result.weak = jsonValueToTsValueFns.bool(value.weak);
  if (value.unverifiedLazy !== undefined) result.unverifiedLazy = jsonValueToTsValueFns.bool(value.unverifiedLazy);
  if (value.debugRedact !== undefined) result.debugRedact = jsonValueToTsValueFns.bool(value.debugRedact);
  if (value.retention !== undefined) result.retention = jsonValueToTsValueFns.enum(value.retention) as OptionRetention;
  if (value.target !== undefined) result.target = jsonValueToTsValueFns.enum(value.target) as OptionTargetType;
  result.uninterpretedOption = value.uninterpretedOption?.map((value: any) => decodeJson_1(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.FieldOptions): Uint8Array {
  const result: WireMessage = [];
  if (value.ctype !== undefined) {
    const tsValue = value.ctype;
    result.push(
      [1, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  if (value.packed !== undefined) {
    const tsValue = value.packed;
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
  if (value.lazy !== undefined) {
    const tsValue = value.lazy;
    result.push(
      [5, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.jstype !== undefined) {
    const tsValue = value.jstype;
    result.push(
      [6, { type: WireType.Varint as const, value: new Long(name2num_1[tsValue as keyof typeof name2num_1]) }],
    );
  }
  if (value.weak !== undefined) {
    const tsValue = value.weak;
    result.push(
      [10, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.unverifiedLazy !== undefined) {
    const tsValue = value.unverifiedLazy;
    result.push(
      [15, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.debugRedact !== undefined) {
    const tsValue = value.debugRedact;
    result.push(
      [16, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.retention !== undefined) {
    const tsValue = value.retention;
    result.push(
      [17, { type: WireType.Varint as const, value: new Long(name2num_2[tsValue as keyof typeof name2num_2]) }],
    );
  }
  if (value.target !== undefined) {
    const tsValue = value.target;
    result.push(
      [18, { type: WireType.Varint as const, value: new Long(name2num_3[tsValue as keyof typeof name2num_3]) }],
    );
  }
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FieldOptions {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.ctype = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.packed = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.deprecated = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.lazy = value;
  }
  field: {
    const wireValue = wireFields.get(6);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_1[wireValue.value[0] as keyof typeof num2name_1] : undefined;
    if (value === undefined) break field;
    result.jstype = value;
  }
  field: {
    const wireValue = wireFields.get(10);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.weak = value;
  }
  field: {
    const wireValue = wireFields.get(15);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.unverifiedLazy = value;
  }
  field: {
    const wireValue = wireFields.get(16);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.debugRedact = value;
  }
  field: {
    const wireValue = wireFields.get(17);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_2[wireValue.value[0] as keyof typeof num2name_2] : undefined;
    if (value === undefined) break field;
    result.retention = value;
  }
  field: {
    const wireValue = wireFields.get(18);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_3[wireValue.value[0] as keyof typeof num2name_3] : undefined;
    if (value === undefined) break field;
    result.target = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 999).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.uninterpretedOption = value as any;
  }
  return result;
}
