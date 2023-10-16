// @ts-nocheck
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
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../../../../../core/runtime/wire/scalar.ts";
import {
  default as Long,
} from "../../../../../core/runtime/Long.ts";
import {
  default as deserialize,
} from "../../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf.FieldOptions {
  export type EditionDefault = {
    value?: string;
    edition?: Edition;
  }
}

export type Type = $.google.protobuf.FieldOptions.EditionDefault;

export function getDefaultValue(): $.google.protobuf.FieldOptions.EditionDefault {
  return {
    value: undefined,
    edition: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.FieldOptions.EditionDefault>): $.google.protobuf.FieldOptions.EditionDefault {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.FieldOptions.EditionDefault): unknown {
  const result: any = {};
  if (value.value !== undefined) result.value = tsValueToJsonValueFns.string(value.value);
  if (value.edition !== undefined) result.edition = tsValueToJsonValueFns.enum(value.edition);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.FieldOptions.EditionDefault {
  const result = getDefaultValue();
  if (value.value !== undefined) result.value = jsonValueToTsValueFns.string(value.value);
  if (value.edition !== undefined) result.edition = jsonValueToTsValueFns.enum(value.edition) as Edition;
  return result;
}

export function encodeBinary(value: $.google.protobuf.FieldOptions.EditionDefault): Uint8Array {
  const result: WireMessage = [];
  if (value.value !== undefined) {
    const tsValue = value.value;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
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

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FieldOptions.EditionDefault {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.value = value;
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
