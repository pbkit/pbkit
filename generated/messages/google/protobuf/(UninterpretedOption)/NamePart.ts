import {
  WireMessage,
} from "../../../../../core/runtime/wire/index.ts";
import {
  default as serialize,
} from "../../../../../core/runtime/wire/serialize.ts";
import {
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../../../../../core/runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../../../../../core/runtime/wire/deserialize.ts";

declare namespace $.google.protobuf.UninterpretedOption {
  export interface NamePart {
    namePart: string;
    isExtension: boolean;
  }
}
export type Type = $.google.protobuf.UninterpretedOption.NamePart;

export function getDefaultValue(): $.google.protobuf.UninterpretedOption.NamePart {
  return {
    namePart: "",
    isExtension: false,
  };
}

export function encodeBinary(value: $.google.protobuf.UninterpretedOption.NamePart): Uint8Array {
  const result: WireMessage = [];
  if (value.namePart !== undefined) {
    const tsValue = value.namePart;
    result.push(
      [1, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.isExtension !== undefined) {
    const tsValue = value.isExtension;
    result.push(
      [2, tsValueToWireValueFns.bool(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.UninterpretedOption.NamePart {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.namePart = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bool(wireValue);
    if (value === undefined) break field;
    result.isExtension = value;
  }
  return result;
}
