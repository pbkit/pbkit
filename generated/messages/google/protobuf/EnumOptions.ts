// @ts-nocheck
import {
  Type as FeatureSet,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./FeatureSet.ts";
import {
  Type as UninterpretedOption,
  encodeJson as encodeJson_2,
  decodeJson as decodeJson_2,
  encodeBinary as encodeBinary_2,
  decodeBinary as decodeBinary_2,
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
  export type EnumOptions = {
    allowAlias?: boolean;
    deprecated?: boolean;
    /** @deprecated */
    deprecatedLegacyJsonFieldConflicts?: boolean;
    features?: FeatureSet;
    uninterpretedOption: UninterpretedOption[];
  }
}

export type Type = $.google.protobuf.EnumOptions;

export function getDefaultValue(): $.google.protobuf.EnumOptions {
  return {
    allowAlias: undefined,
    deprecated: undefined,
    deprecatedLegacyJsonFieldConflicts: undefined,
    features: undefined,
    uninterpretedOption: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.EnumOptions>): $.google.protobuf.EnumOptions {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.EnumOptions): unknown {
  const result: any = {};
  if (value.allowAlias !== undefined) result.allowAlias = tsValueToJsonValueFns.bool(value.allowAlias);
  if (value.deprecated !== undefined) result.deprecated = tsValueToJsonValueFns.bool(value.deprecated);
  if (value.deprecatedLegacyJsonFieldConflicts !== undefined) result.deprecatedLegacyJsonFieldConflicts = tsValueToJsonValueFns.bool(value.deprecatedLegacyJsonFieldConflicts);
  if (value.features !== undefined) result.features = encodeJson_1(value.features);
  result.uninterpretedOption = value.uninterpretedOption.map(value => encodeJson_2(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.EnumOptions {
  const result = getDefaultValue();
  if (value.allowAlias !== undefined) result.allowAlias = jsonValueToTsValueFns.bool(value.allowAlias);
  if (value.deprecated !== undefined) result.deprecated = jsonValueToTsValueFns.bool(value.deprecated);
  if (value.deprecatedLegacyJsonFieldConflicts !== undefined) result.deprecatedLegacyJsonFieldConflicts = jsonValueToTsValueFns.bool(value.deprecatedLegacyJsonFieldConflicts);
  if (value.features !== undefined) result.features = decodeJson_1(value.features);
  result.uninterpretedOption = value.uninterpretedOption?.map((value: any) => decodeJson_2(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.EnumOptions): Uint8Array {
  const result: WireMessage = [];
  if (value.allowAlias !== undefined) {
    const tsValue = value.allowAlias;
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
  if (value.deprecatedLegacyJsonFieldConflicts !== undefined) {
    const tsValue = value.deprecatedLegacyJsonFieldConflicts;
    result.push(
      [6, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.features !== undefined) {
    const tsValue = value.features;
    result.push(
      [7, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_2(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.EnumOptions {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.allowAlias = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.deprecated = value;
  }
  field: {
    const wireValue = wireFields.get(6);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.deprecatedLegacyJsonFieldConflicts = value;
  }
  field: {
    const wireValue = wireFields.get(7);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.features = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 999).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_2(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.uninterpretedOption = value as any;
  }
  return result;
}
