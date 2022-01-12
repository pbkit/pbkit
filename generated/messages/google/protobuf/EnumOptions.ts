import {
  Type as UninterpretedOption,
  encodeBinary as encodeBinary_1,
  encodeJson as encodeJson_1,
  decodeBinary as decodeBinary_1,
} from "./UninterpretedOption.ts";
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
  tsValueToJsonValueFns,
} from "../../../../core/runtime/json/scalar.ts";
import {
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

declare namespace $.google.protobuf {
  export interface EnumOptions {
    allowAlias?: boolean;
    deprecated?: boolean;
    uninterpretedOption: UninterpretedOption[];
  }
}
export type Type = $.google.protobuf.EnumOptions;

export function getDefaultValue(): $.google.protobuf.EnumOptions {
  return {
    allowAlias: false,
    deprecated: false,
    uninterpretedOption: [],
  };
}

export function encodeJson(value: $.google.protobuf.EnumOptions): unknown {
  const result: any = {};
  if (value.allowAlias !== undefined) result.allowAlias = tsValueToJsonValueFns.bool(value.allowAlias);
  if (value.deprecated !== undefined) result.deprecated = tsValueToJsonValueFns.bool(value.deprecated);
  if (value.uninterpretedOption !== undefined) result.uninterpretedOption = value.uninterpretedOption.map(encodeJson_1);
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
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
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
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 999).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.uninterpretedOption = value as any;
  }
  return result;
}
