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
  export type ServiceOptions = {
    deprecated?: boolean;
    features?: FeatureSet;
    uninterpretedOption: UninterpretedOption[];
  }
}

export type Type = $.google.protobuf.ServiceOptions;

export function getDefaultValue(): $.google.protobuf.ServiceOptions {
  return {
    deprecated: undefined,
    features: undefined,
    uninterpretedOption: [],
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.ServiceOptions>): $.google.protobuf.ServiceOptions {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.ServiceOptions): unknown {
  const result: any = {};
  if (value.deprecated !== undefined) result.deprecated = tsValueToJsonValueFns.bool(value.deprecated);
  if (value.features !== undefined) result.features = encodeJson_1(value.features);
  result.uninterpretedOption = value.uninterpretedOption.map(value => encodeJson_2(value));
  return result;
}

export function decodeJson(value: any): $.google.protobuf.ServiceOptions {
  const result = getDefaultValue();
  if (value.deprecated !== undefined) result.deprecated = jsonValueToTsValueFns.bool(value.deprecated);
  if (value.features !== undefined) result.features = decodeJson_1(value.features);
  result.uninterpretedOption = value.uninterpretedOption?.map((value: any) => decodeJson_2(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.google.protobuf.ServiceOptions): Uint8Array {
  const result: WireMessage = [];
  if (value.deprecated !== undefined) {
    const tsValue = value.deprecated;
    result.push(
      [33, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  if (value.features !== undefined) {
    const tsValue = value.features;
    result.push(
      [34, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_2(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.ServiceOptions {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(33);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.deprecated = value;
  }
  field: {
    const wireValue = wireFields.get(34);
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
