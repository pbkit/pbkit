import {
  Type as Semantic,
  name2num,
  num2name,
} from "./(Annotation)/Semantic.ts";
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
  unpackFns,
} from "../../../../../core/runtime/wire/scalar.ts";
import {
  default as Long,
} from "../../../../../core/runtime/Long.ts";
import {
  default as deserialize,
} from "../../../../../core/runtime/wire/deserialize.ts";

export declare namespace $.google.protobuf.GeneratedCodeInfo {
  export type Annotation = {
    path: number[];
    sourceFile?: string;
    begin?: number;
    end?: number;
    semantic?: Semantic;
  }
}
export type Type = $.google.protobuf.GeneratedCodeInfo.Annotation;

export function getDefaultValue(): $.google.protobuf.GeneratedCodeInfo.Annotation {
  return {
    path: [],
    sourceFile: undefined,
    begin: undefined,
    end: undefined,
    semantic: undefined,
  };
}

export function createValue(partialValue: Partial<$.google.protobuf.GeneratedCodeInfo.Annotation>): $.google.protobuf.GeneratedCodeInfo.Annotation {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.google.protobuf.GeneratedCodeInfo.Annotation): unknown {
  const result: any = {};
  result.path = value.path.map(value => tsValueToJsonValueFns.int32(value));
  if (value.sourceFile !== undefined) result.sourceFile = tsValueToJsonValueFns.string(value.sourceFile);
  if (value.begin !== undefined) result.begin = tsValueToJsonValueFns.int32(value.begin);
  if (value.end !== undefined) result.end = tsValueToJsonValueFns.int32(value.end);
  if (value.semantic !== undefined) result.semantic = tsValueToJsonValueFns.enum(value.semantic);
  return result;
}

export function decodeJson(value: any): $.google.protobuf.GeneratedCodeInfo.Annotation {
  const result = getDefaultValue();
  result.path = value.path?.map((value: any) => jsonValueToTsValueFns.int32(value)) ?? [];
  if (value.sourceFile !== undefined) result.sourceFile = jsonValueToTsValueFns.string(value.sourceFile);
  if (value.begin !== undefined) result.begin = jsonValueToTsValueFns.int32(value.begin);
  if (value.end !== undefined) result.end = jsonValueToTsValueFns.int32(value.end);
  if (value.semantic !== undefined) result.semantic = jsonValueToTsValueFns.enum(value.semantic) as Semantic;
  return result;
}

export function encodeBinary(value: $.google.protobuf.GeneratedCodeInfo.Annotation): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.path) {
    result.push(
      [1, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.sourceFile !== undefined) {
    const tsValue = value.sourceFile;
    result.push(
      [2, tsValueToWireValueFns.string(tsValue)],
    );
  }
  if (value.begin !== undefined) {
    const tsValue = value.begin;
    result.push(
      [3, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.end !== undefined) {
    const tsValue = value.end;
    result.push(
      [4, tsValueToWireValueFns.int32(tsValue)],
    );
  }
  if (value.semantic !== undefined) {
    const tsValue = value.semantic;
    result.push(
      [5, { type: WireType.Varint as const, value: new Long(name2num[tsValue as keyof typeof name2num]) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.google.protobuf.GeneratedCodeInfo.Annotation {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = Array.from(unpackFns.int32(wireValues));
    if (!value.length) break collection;
    result.path = value as any;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.sourceFile = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.begin = value;
  }
  field: {
    const wireValue = wireFields.get(4);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.int32(wireValue);
    if (value === undefined) break field;
    result.end = value;
  }
  field: {
    const wireValue = wireFields.get(5);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.Varint ? num2name[wireValue.value[0] as keyof typeof num2name] : undefined;
    if (value === undefined) break field;
    result.semantic = value;
  }
  return result;
}
