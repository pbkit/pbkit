import Long from "../Long.ts";
import { decode } from "./varint.ts";
import { Field, WireType } from "./index.ts";

type WireValueToJsValue<T> = (wireValue: Field) => T | undefined;
type Unpack<T> = (wireValues: Iterable<Field>) => Generator<T>;

interface WireValueToJsValueFns extends NumericWireValueToJsValueFns {
  string: WireValueToJsValue<string>;
  bytes: WireValueToJsValue<Uint8Array>;
}

interface NumericWireValueToJsValueFns extends VarintFieldToJsValueFns {
  double: WireValueToJsValue<number>;
  float: WireValueToJsValue<number>;
}

type PostprocessVarintFns = typeof postprocessVarintFns;
export const postprocessVarintFns = {
  int32: (long: Long) => long[0] | 0,
  int64: (long: Long) => long.toString(true),
  uint32: (long: Long) => long[0] >>> 0,
  uint64: (long: Long) => long.toString(false),
  sint32: (long: Long) => undefined, // TODO
  sint64: (long: Long) => undefined, // TODO
  fixed32: (long: Long) => undefined, // TODO
  fixed64: (long: Long) => undefined, // TODO
  sfixed32: (long: Long) => undefined, // TODO
  sfixed64: (long: Long) => undefined, // TODO
  bool: (long: Long) => long[0] !== 0,
};

type VarintFieldToJsValueFns = typeof varintFieldToJsValueFns;
const varintFieldToJsValueFns = Object.fromEntries(
  Object.entries(postprocessVarintFns).map(([type, fn]) => [
    type,
    (wireValue: Field) => {
      if (wireValue.type !== WireType.Varint) return;
      return fn(wireValue.value);
    },
  ]),
) as {
  [type in keyof PostprocessVarintFns]: WireValueToJsValue<
    ReturnType<PostprocessVarintFns[type]>
  >;
};

export const wireValueToJsValueFns: WireValueToJsValueFns = {
  ...varintFieldToJsValueFns,
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

type UnpackFns = {
  [type in keyof NumericWireValueToJsValueFns]: Unpack<
    NonNullable<ReturnType<NumericWireValueToJsValueFns[type]>>
  >;
};
export const unpackFns: UnpackFns = {
  *double(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToJsValueFns.double(wireValue);
      if (value != null) yield value;
      else yield* unpackDouble(wireValue);
    }
  },
  *float(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToJsValueFns.float(wireValue);
      if (value != null) yield value;
      else yield* unpackFloat(wireValue);
    }
  },
  *int32(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToJsValueFns.int32(wireValue);
      if (value != null) yield value;
      else {
        for (const long of unpackVarint(wireValue)) {
          yield postprocessVarintFns.int32(long);
        }
      }
    }
  },
};

function* unpackDouble(wireValue: Field): Generator<number> {
  if (wireValue.type !== WireType.LengthDelimited) return;
  const { value } = wireValue;
  let idx = 0;
  const dataview = new DataView(value.buffer, value.byteOffset);
  while (idx < value.length) {
    const double = dataview.getFloat64(idx, true);
    idx += 4;
    yield double;
  }
}

function* unpackFloat(wireValue: Field): Generator<number> {
  if (wireValue.type !== WireType.LengthDelimited) return;
  const { value } = wireValue;
  let idx = 0;
  const dataview = new DataView(value.buffer, value.byteOffset);
  while (idx < value.length) {
    const float = dataview.getFloat32(idx, true);
    idx += 4;
    yield float;
  }
}

function* unpackVarint(wireValue: Field): Generator<Long> {
  if (wireValue.type !== WireType.LengthDelimited) return;
  const { value } = wireValue;
  let idx = 0;
  const offset = value.byteOffset;
  while (idx < value.length) {
    const decodeResult = decode(new DataView(value.buffer, offset + idx));
    idx += decodeResult[0];
    yield decodeResult[1];
  }
}

function* unpackFixed32(wireValue: Field): Generator<number> {
  if (wireValue.type !== WireType.LengthDelimited) return;
  const { value } = wireValue;
  let idx = 0;
  const dataview = new DataView(value.buffer, value.byteOffset);
  while (idx < value.length) {
    const fixed32 = dataview.getUint32(idx, true);
    idx += 4;
    yield fixed32;
  }
}

function* unpackFixed64(wireValue: Field): Generator<Long> {
  if (wireValue.type !== WireType.LengthDelimited) return;
  const { value } = wireValue;
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
