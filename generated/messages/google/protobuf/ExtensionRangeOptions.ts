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
  default as deserialize,
} from "../../../../core/runtime/wire/deserialize.ts";

declare namespace $.google.protobuf {
  export interface ExtensionRangeOptions {
    uninterpretedOption: UninterpretedOption[];
  }
}
export type Type = $.google.protobuf.ExtensionRangeOptions;

export function getDefaultValue(): $.google.protobuf.ExtensionRangeOptions {
  return {
    uninterpretedOption: [],
  };
}

export function encodeJson(value: $.google.protobuf.ExtensionRangeOptions): unknown {
  const result: any = {};
  if (value.uninterpretedOption !== undefined) result.uninterpretedOption = value.uninterpretedOption.map(encodeJson_1);
  return result;
}

export function encodeBinary(value: $.google.protobuf.ExtensionRangeOptions): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.ExtensionRangeOptions {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 999).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.uninterpretedOption = value as any;
  }
  return result;
}
