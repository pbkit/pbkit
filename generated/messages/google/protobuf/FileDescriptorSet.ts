import {
  Type as FileDescriptorProto,
  encodeBinary as encodeBinary_1,
  encodeJson as encodeJson_1,
  decodeBinary as decodeBinary_1,
} from "./FileDescriptorProto.ts";
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
  export interface FileDescriptorSet {
    file: FileDescriptorProto[];
  }
}
export type Type = $.google.protobuf.FileDescriptorSet;

export function getDefaultValue(): $.google.protobuf.FileDescriptorSet {
  return {
    file: [],
  };
}

export function encodeJson(value: $.google.protobuf.FileDescriptorSet): unknown {
  const result: any = {};
  if (value.file !== undefined) result.file = value.file.map(encodeJson_1);
  return result;
}

export function encodeBinary(value: $.google.protobuf.FileDescriptorSet): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.file) {
    result.push(
      [1, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.FileDescriptorSet {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.file = value as any;
  }
  return result;
}
