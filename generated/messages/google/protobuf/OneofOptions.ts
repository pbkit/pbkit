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
  export interface OneofOptions {
    uninterpretedOption: UninterpretedOption[];
  }
}
export type Type = $.google.protobuf.OneofOptions;

export function getDefaultValue(): $.google.protobuf.OneofOptions {
  return {
    uninterpretedOption: [],
  };
}

export function encodeJson(value: $.google.protobuf.OneofOptions): unknown {
  const result: any = {};
  result.uninterpretedOption = value.uninterpretedOption.map(value => encodeJson_1(value));
  return result;
}

export function encodeBinary(value: $.google.protobuf.OneofOptions): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.uninterpretedOption) {
    result.push(
      [999, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.OneofOptions {
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
