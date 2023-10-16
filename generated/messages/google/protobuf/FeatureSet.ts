// @ts-nocheck
import {
  Type as FieldPresence,
  name2num,
  num2name,
} from "./(FeatureSet)/FieldPresence.ts";
import {
  Type as EnumType,
  name2num as name2num_1,
  num2name as num2name_1,
} from "./(FeatureSet)/EnumType.ts";
import {
  Type as RepeatedFieldEncoding,
  name2num as name2num_2,
  num2name as num2name_2,
} from "./(FeatureSet)/RepeatedFieldEncoding.ts";
import {
  Type as Utf8Validation,
  name2num as name2num_3,
  num2name as num2name_3,
} from "./(FeatureSet)/Utf8Validation.ts";
import {
  Type as MessageEncoding,
  name2num as name2num_4,
  num2name as num2name_4,
} from "./(FeatureSet)/MessageEncoding.ts";
import {
  Type as JsonFormat,
  name2num as name2num_5,
  num2name as num2name_5,
} from "./(FeatureSet)/JsonFormat.ts";
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
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf {
  export type FeatureSet = {
    fieldPresence?: FieldPresence;
    enumType?: EnumType;
    repeatedFieldEncoding?: RepeatedFieldEncoding;
    utf8Validation?: Utf8Validation;
    messageEncoding?: MessageEncoding;
    jsonFormat?: JsonFormat;
  }
}

export type Type = $.google.protobuf.FeatureSet;

export function getDefaultValue(): $.google.protobuf.FeatureSet {
  return {
    fieldPresence: undefined,
    enumType: undefined,
    repeatedFieldEncoding: undefined,
    utf8Validation: undefined,
    messageEncoding: undefined,
    jsonFormat: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.FeatureSet>): $.google.protobuf.FeatureSet {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.FeatureSet): unknown {
  const result: any = {};
  if (value.fieldPresence !== undefined) result.fieldPresence = tsValueToJsonValueFns.enum(value.fieldPresence);
  if (value.enumType !== undefined) result.enumType = tsValueToJsonValueFns.enum(value.enumType);
  if (value.repeatedFieldEncoding !== undefined) result.repeatedFieldEncoding = tsValueToJsonValueFns.enum(value.repeatedFieldEncoding);
  if (value.utf8Validation !== undefined) result.utf8Validation = tsValueToJsonValueFns.enum(value.utf8Validation);
  if (value.messageEncoding !== undefined) result.messageEncoding = tsValueToJsonValueFns.enum(value.messageEncoding);
  if (value.jsonFormat !== undefined) result.jsonFormat = tsValueToJsonValueFns.enum(value.jsonFormat);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FeatureSet {
  const result = getDefaultValue();
  if (value.fieldPresence !== undefined) result.fieldPresence = jsonValueToTsValueFns.enum(value.fieldPresence) as FieldPresence;
  if (value.enumType !== undefined) result.enumType = jsonValueToTsValueFns.enum(value.enumType) as EnumType;
  if (value.repeatedFieldEncoding !== undefined) result.repeatedFieldEncoding = jsonValueToTsValueFns.enum(value.repeatedFieldEncoding) as RepeatedFieldEncoding;
  if (value.utf8Validation !== undefined) result.utf8Validation = jsonValueToTsValueFns.enum(value.utf8Validation) as Utf8Validation;
  if (value.messageEncoding !== undefined) result.messageEncoding = jsonValueToTsValueFns.enum(value.messageEncoding) as MessageEncoding;
  if (value.jsonFormat !== undefined) result.jsonFormat = jsonValueToTsValueFns.enum(value.jsonFormat) as JsonFormat;
  return result;
}

export function encodeBinary(value: $.google.protobuf.FeatureSet): Uint8Array {
  const result: WireMessage = [];
  if (value.fieldPresence !== undefined) {
    const tsValue = value.fieldPresence;
    result.push(
      [1, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  if (value.enumType !== undefined) {
    const tsValue = value.enumType;
    result.push(
      [2, { type: WireType.Varint as const, value: new Long(name2num_1[tsValue as keyof typeof name2num_1]) }],
    );
  }
  if (value.repeatedFieldEncoding !== undefined) {
    const tsValue = value.repeatedFieldEncoding;
    result.push(
      [3, { type: WireType.Varint as const, value: new Long(name2num_2[tsValue as keyof typeof name2num_2]) }],
    );
  }
  if (value.utf8Validation !== undefined) {
    const tsValue = value.utf8Validation;
    result.push(
      [4, { type: WireType.Varint as const, value: new Long(name2num_3[tsValue as keyof typeof name2num_3]) }],
    );
  }
  if (value.messageEncoding !== undefined) {
    const tsValue = value.messageEncoding;
    result.push(
      [5, { type: WireType.Varint as const, value: new Long(name2num_4[tsValue as keyof typeof name2num_4]) }],
    );
  }
  if (value.jsonFormat !== undefined) {
    const tsValue = value.jsonFormat;
    result.push(
      [6, { type: WireType.Varint as const, value: new Long(name2num_5[tsValue as keyof typeof name2num_5]) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FeatureSet {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.fieldPresence = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_1[wireValue.value[0] as keyof typeof num2name_1] : undefined;
    if (value === undefined) break field;
    result.enumType = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_2[wireValue.value[0] as keyof typeof num2name_2] : undefined;
    if (value === undefined) break field;
    result.repeatedFieldEncoding = value;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_3[wireValue.value[0] as keyof typeof num2name_3] : undefined;
    if (value === undefined) break field;
    result.utf8Validation = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_4[wireValue.value[0] as keyof typeof num2name_4] : undefined;
    if (value === undefined) break field;
    result.messageEncoding = value;
  }
  field: {
    const wireValue = wireFields.get(6);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name_5[wireValue.value[0] as keyof typeof num2name_5] : undefined;
    if (value === undefined) break field;
    result.jsonFormat = value;
  }
  return result;
}
