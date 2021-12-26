import {
  Type as Location,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./SourceCodeInfo/Location.ts";
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

export interface Type {
  location: Location[];
}

export function getDefaultValue(): Type {
  return {
    location: [],
  };
}

export function encodeBinary(value: Type): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.location) {
    result.push(
      [1, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): Type {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.location = value as any;
  }
  return result;
}
