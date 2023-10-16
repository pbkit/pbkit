// @ts-nocheck
import {
  Type as Declaration,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./(ExtensionRangeOptions)/Declaration.ts";
import {
  Type as VerificationState,
  name2num,
  num2name,
} from "./(ExtensionRangeOptions)/VerificationState.ts";
import {
  Type as FeatureSet,
  encodeJson as encodeJson_2,
  decodeJson as decodeJson_2,
  encodeBinary as encodeBinary_2,
  decodeBinary as decodeBinary_2,
} from "./FeatureSet.ts";
import {
  Type as UninterpretedOption,
  encodeJson as encodeJson_3,
  decodeJson as decodeJson_3,
  encodeBinary as encodeBinary_3,
  decodeBinary as decodeBinary_3,
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
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf {
  export type ExtensionRangeOptions = {
    declaration: Declaration[];
    verification?: VerificationState;
    features?: FeatureSet;
    uninterpretedOption: UninterpretedOption[];
  }
}

export type Type = $.google.protobuf.ExtensionRangeOptions;

export function getDefaultValue(): $.google.protobuf.ExtensionRangeOptions {
  return {
    declaration: [],
    verification: undefined,
    features: undefined,
    uninterpretedOption: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.ExtensionRangeOptions>): $.google.protobuf.ExtensionRangeOptions {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.ExtensionRangeOptions): unknown {
  const result: any = {};
  result.declaration = value.declaration.map(value => encodeJson_1(value));
  if (value.verification !== undefined) result.verification = tsValueToJsonValueFns.enum(value.verification);
  if (value.features !== undefined) result.features = encodeJson_2(value.features);
  result.uninterpretedOption = value.uninterpretedOption.map(value => encodeJson_3(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.ExtensionRangeOptions {
  const result = getDefaultValue();
  result.declaration = value.declaration?.map((value: any) => decodeJson_1(value)) ?? [];
  if (value.verification !== undefined) result.verification = jsonValueToTsValueFns.enum(value.verification) as VerificationState;
  if (value.features !== undefined) result.features = decodeJson_2(value.features);
  result.uninterpretedOption = value.uninterpretedOption?.map((value: any) => decodeJson_3(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.ExtensionRangeOptions): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.declaration) {
    result.push(
      [2, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.verification !== undefined) {
    const tsValue = value.verification;
    result.push(
      [3, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  if (value.features !== undefined) {
    const tsValue = value.features;
    result.push(
      [50, { type: WireType.LengthDelimited as const, value: encodeBinary_2(tsValue) }],
    );
  }
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_3(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.ExtensionRangeOptions {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 2).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.declaration = value as any;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.verification = value;
  }
  field: {
    const wireValue = wireFields.get(50);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_2(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.features = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 999).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_3(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.uninterpretedOption = value as any;
  }
  return result;
}
