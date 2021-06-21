import Long from "../Long.ts";
import { ScalarValueType } from "../scalar.ts";
import { decode } from "./varint.ts";
import { Field, WireType } from "./index.ts";

type WireValueToJsValue<T> = (wireValue: Field) => T | undefined;
interface WireValueToJsValueTable extends NumericWireValueToJsValueTable {
  bool: WireValueToJsValue<boolean>;
  string: WireValueToJsValue<string>;
  bytes: WireValueToJsValue<Uint8Array>;
}
interface NumericWireValueToJsValueTable
  extends Numeric32WireValueToJsValueTable, Numeric64WireValueToJsValueTable {
  double: WireValueToJsValue<number>;
  float: WireValueToJsValue<number>;
}

type Numeric32ScalarValueType =
  & Exclude<
    ScalarValueType,
    OtherType
  >
  & `${string}32`;
type Numeric64ScalarValueType =
  & Exclude<
    ScalarValueType,
    OtherType
  >
  & `${string}64`;
type OtherType = "bool" | "string" | "bytes";
type Numeric32WireValueToJsValueTable = {
  [typePath in Numeric32ScalarValueType]: WireValueToJsValue<number>;
};
type Numeric64WireValueToJsValueTable = {
  [typePath in Numeric64ScalarValueType]: WireValueToJsValue<string>;
};
export const wireValueToJsValue: WireValueToJsValueTable = {
  double: (wireValue) => {
    if (wireValue.type !== WireType.Fixed64) return;
    const dataview = new DataView(wireValue.value.buffer);
    return dataview.getFloat64(0, true);
  },
  float: (wireValue) => {
    if (wireValue.type !== WireType.Fixed32) return;
    const dataview = new DataView(new Uint32Array([wireValue.value]).buffer);
    return dataview.getFloat32(0, true);
  },
  int32: (wireValue) => {
    if (wireValue.type !== WireType.Varint) return;
    return wireValue.value[0] | 0;
  },
  int64: (wireValue) => {
    if (wireValue.type !== WireType.Varint) return;
    return wireValue.value.toString(true);
  },
  uint32: (wireValue) => {
    if (wireValue.type !== WireType.Varint) return;
    return wireValue.value[0] >>> 0;
  },
  uint64: (wireValue) => {
    if (wireValue.type !== WireType.Varint) return;
    return wireValue.value.toString(false);
  },
  sint32: (wireValue) => {
    return undefined; // TODO
  },
  sint64: (wireValue) => {
    return undefined; // TODO
  },
  fixed32: (wireValue) => {
    return undefined; // TODO
  },
  fixed64: (wireValue) => {
    return undefined; // TODO
  },
  sfixed32: (wireValue) => {
    return undefined; // TODO
  },
  sfixed64: (wireValue) => {
    return undefined; // TODO
  },
  bool: (wireValue) => {
    if (wireValue.type !== WireType.Varint) return;
    return wireValue.value[0] !== 0;
  },
  string: (wireValue) => {
    if (wireValue.type !== WireType.LengthDelimited) return;
    const textDecoder = new TextDecoder();
    return textDecoder.decode(wireValue.value);
  },
  bytes: (wireValue) => {
    if (wireValue.type !== WireType.LengthDelimited) return;
    return wireValue.value;
  },
};

function* unpackVarint(value: Uint8Array): Generator<Long> {
  let idx = 0;
  const offset = value.byteOffset;
  while (idx < value.length) {
    const decodeResult = decode(new DataView(value.buffer, offset + idx));
    idx += decodeResult[0];
    yield decodeResult[1];
  }
}

function* unpackFloat(value: Uint8Array): Generator<number> {
  let idx = 0;
  const dataview = new DataView(value.buffer, value.byteOffset);
  while (idx < value.length) {
    const float = dataview.getFloat32(idx, true);
    idx += 4;
    yield float;
  }
}

function* unpackDouble(value: Uint8Array): Generator<number> {
  let idx = 0;
  const dataview = new DataView(value.buffer, value.byteOffset);
  while (idx < value.length) {
    const double = dataview.getFloat64(idx, true);
    idx += 4;
    yield double;
  }
}

function* unpackFixed32(value: Uint8Array): Generator<number> {
  let idx = 0;
  const dataview = new DataView(value.buffer, value.byteOffset);
  while (idx < value.length) {
    const fixed32 = dataview.getUint32(idx, true);
    idx += 4;
    yield fixed32;
  }
}

function* unpackFixed64(value: Uint8Array): Generator<Long> {
  let idx = 0;
  const dataview = new DataView(value.buffer, value.byteOffset);
  while (idx < value.length) {
    const lo = dataview.getUint32(idx, true);
    idx += 4;
    const hi = dataview.getUint32(idx, true);
    idx += 4;
    yield new Long(lo, hi);
  }
}
