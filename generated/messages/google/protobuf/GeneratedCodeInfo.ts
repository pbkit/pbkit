import {
  Type as Annotation,
  encodeBinary as encodeBinary_1,
  encodeJson as encodeJson_1,
  decodeBinary as decodeBinary_1,
} from "./(GeneratedCodeInfo)/Annotation.ts";
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
  export interface GeneratedCodeInfo {
    annotation: Annotation[];
  }
}
export type Type = $.google.protobuf.GeneratedCodeInfo;

export function getDefaultValue(): $.google.protobuf.GeneratedCodeInfo {
  return {
    annotation: [],
  };
}

export function encodeJson(value: $.google.protobuf.GeneratedCodeInfo): unknown {
  const result: any = {};
  if (value.annotation !== undefined) result.annotation = value.annotation.map(encodeJson_1);
  return result;
}

export function encodeBinary(value: $.google.protobuf.GeneratedCodeInfo): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.annotation) {
    result.push(
      [1, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.GeneratedCodeInfo {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.annotation = value as any;
  }
  return result;
}
