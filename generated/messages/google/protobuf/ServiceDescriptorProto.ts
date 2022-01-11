import {
  Type as MethodDescriptorProto,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./MethodDescriptorProto.ts";
import {
  Type as ServiceOptions,
  encodeBinary as encodeBinary_2,
  decodeBinary as decodeBinary_2,
} from "./ServiceOptions.ts";
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

declare namespace $.google.protobuf {
  export interface ServiceDescriptorProto {
    name?: string;
    method: MethodDescriptorProto[];
    options?: ServiceOptions;
  }
}
export type Type = $.google.protobuf.ServiceDescriptorProto;

export function getDefaultValue(): $.google.protobuf.ServiceDescriptorProto {
  return {
    name: "",
    method: [],
    options: undefined,
  };
}

export function encodeBinary(value: $.google.protobuf.ServiceDescriptorProto): Uint8Array {
  const result: WireMessage = [];
  if (value.name !== undefined) {
    const tsValue = value.name;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  for (const tsValue of value.method) {
    result.push(
      [2, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.options !== undefined) {
    const tsValue = value.options;
    result.push(
      [3, { type: WireType.LengthDelimited as const, value: encodeBinary_2(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.ServiceDescriptorProto {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.name = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 2).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.method = value as any;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_2(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.options = value;
  }
  return result;
}
