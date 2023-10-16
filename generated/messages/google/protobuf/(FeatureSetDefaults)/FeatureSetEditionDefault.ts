// @ts-nocheck
import {
  Type as FeatureSet,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "../FeatureSet.ts";
import {
  Type as Edition,
  name2num,
  num2name,
} from "../Edition.ts";
import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../../../../../core/runtime/json/scalar.ts";
import {
  WireMessage,
  WireType,
} from "../../../../../core/runtime/wire/index.ts";
import {
  default as serialize,
} from "../../../../../core/runtime/wire/serialize.ts";
import {
  default as Long,
} from "../../../../../core/runtime/Long.ts";
import {
  default as deserialize,
} from "../../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf.FeatureSetDefaults {
  export type FeatureSetEditionDefault = {
    features?: FeatureSet;
    edition?: Edition;
  }
}

export type Type = $.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault;

export function getDefaultValue(): $.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault {
  return {
    features: undefined,
    edition: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault>): $.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault): unknown {
  const result: any = {};
  if (value.features !== undefined) result.features = encodeJson_1(value.features);
  if (value.edition !== undefined) result.edition = tsValueToJsonValueFns.enum(value.edition);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault {
  const result = getDefaultValue();
  if (value.features !== undefined) result.features = decodeJson_1(value.features);
  if (value.edition !== undefined) result.edition = jsonValueToTsValueFns.enum(value.edition) as Edition;
  return result;
}

export function encodeBinary(value: $.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault): Uint8Array {
  const result: WireMessage = [];
  if (value.features !== undefined) {
    const tsValue = value.features;
    result.push(
      [2, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.edition !== undefined) {
    const tsValue = value.edition;
    result.push(
      [3, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.features = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.edition = value;
  }
  return result;
}
