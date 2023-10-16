// @ts-nocheck
import {
  Type as FeatureSetEditionDefault,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./(FeatureSetDefaults)/FeatureSetEditionDefault.ts";
import {
  Type as Edition,
  name2num,
  num2name,
} from "./Edition.ts";
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
  export type FeatureSetDefaults = {
    defaults: FeatureSetEditionDefault[];
    minimumEdition?: Edition;
    maximumEdition?: Edition;
  }
}

export type Type = $.google.protobuf.FeatureSetDefaults;

export function getDefaultValue(): $.google.protobuf.FeatureSetDefaults {
  return {
    defaults: [],
    minimumEdition: undefined,
    maximumEdition: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.FeatureSetDefaults>): $.google.protobuf.FeatureSetDefaults {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.FeatureSetDefaults): unknown {
  const result: any = {};
  result.defaults = value.defaults.map(value => encodeJson_1(value));
  if (value.minimumEdition !== undefined) result.minimumEdition = tsValueToJsonValueFns.enum(value.minimumEdition);
  if (value.maximumEdition !== undefined) result.maximumEdition = tsValueToJsonValueFns.enum(value.maximumEdition);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FeatureSetDefaults {
  const result = getDefaultValue();
  result.defaults = value.defaults?.map((value: any) => decodeJson_1(value)) ?? [];
  if (value.minimumEdition !== undefined) result.minimumEdition = jsonValueToTsValueFns.enum(value.minimumEdition) as Edition;
  if (value.maximumEdition !== undefined) result.maximumEdition = jsonValueToTsValueFns.enum(value.maximumEdition) as Edition;
  return result;
}

export function encodeBinary(value: $.google.protobuf.FeatureSetDefaults): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.defaults) {
    result.push(
      [1, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.minimumEdition !== undefined) {
    const tsValue = value.minimumEdition;
    result.push(
      [4, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  if (value.maximumEdition !== undefined) {
    const tsValue = value.maximumEdition;
    result.push(
      [5, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FeatureSetDefaults {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.defaults = value as any;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.minimumEdition = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.maximumEdition = value;
  }
  return result;
}
