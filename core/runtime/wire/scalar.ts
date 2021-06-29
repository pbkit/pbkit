import Long from "../Long.ts";
import { decode as decodeVarint } from "./varint.ts";
import { decode as decodeZigzag, encode as encodeZigzag } from "./zigzag.ts";
import { Field, WireType } from "./index.ts";

type WireValueToTsValue<T> = (wireValue: Field) => T | undefined;
type TsValueToWireValue<T> = (tsValue: T) => Field;
type Unpack<T> = (wireValues: Iterable<Field>) => Generator<T>;
type Pack<T> = (values: Iterable<T>) => Field;

interface WireValueToTsValueFns extends NumericWireValueToTsValueFns {
  string: WireValueToTsValue<string>;
  bytes: WireValueToTsValue<Uint8Array>;
}

interface TsValueToWireValueFns extends TsValueToNumericWireValueFns {
  string: TsValueToWireValue<string>;
  bytes: TsValueToWireValue<Uint8Array>;
}

interface NumericWireValueToTsValueFns extends VarintFieldToTsValueFns {
  double: WireValueToTsValue<number>;
  float: WireValueToTsValue<number>;
  fixed32: WireValueToTsValue<number>;
  fixed64: WireValueToTsValue<string>;
  sfixed32: WireValueToTsValue<number>;
  sfixed64: WireValueToTsValue<string>;
}

interface TsValueToNumericWireValueFns extends TsValueToVarintFieldFns {
  double: TsValueToWireValue<number>;
  float: TsValueToWireValue<number>;
  fixed32: TsValueToWireValue<number>;
  fixed64: TsValueToWireValue<string>;
  sfixed32: TsValueToWireValue<number>;
  sfixed64: TsValueToWireValue<string>;
}

type PostprocessVarintFns = typeof postprocessVarintFns;
export const postprocessVarintFns = {
  int32: (long: Long) => long[0] | 0,
  int64: (long: Long) => long.toString(true),
  uint32: (long: Long) => long[0] >>> 0,
  uint64: (long: Long) => long.toString(false),
  sint32: (long: Long) => decodeZigzag(long[0]),
  sint64: (long: Long) => decodeZigzag(long),
  bool: (long: Long) => long[0] !== 0,
};

type VarintFieldToTsValueFns = typeof varintFieldToTsValueFns;
const varintFieldToTsValueFns = Object.fromEntries(
  Object.entries(postprocessVarintFns).map(([type, fn]) => [
    type,
    (wireValue: Field) => {
      if (wireValue.type !== WireType.Varint) return;
      return fn(wireValue.value);
    },
  ]),
) as {
  [type in keyof PostprocessVarintFns]: WireValueToTsValue<
    ReturnType<PostprocessVarintFns[type]>
  >;
};

type TsValueToVarintFieldFns = typeof tsValueToVarintFieldFns;
const tsValueToVarintFieldFns: {
  [type in keyof PostprocessVarintFns]: TsValueToWireValue<
    ReturnType<PostprocessVarintFns[type]>
  >;
} = {
  int32: (tsValue) => ({ type: WireType.Varint, value: new Long(tsValue) }),
  int64: (tsValue) => ({ type: WireType.Varint, value: Long.parse(tsValue) }),
  uint32: (tsValue) => ({ type: WireType.Varint, value: new Long(tsValue) }),
  uint64: (tsValue) => ({ type: WireType.Varint, value: Long.parse(tsValue) }),
  sint32: (tsValue) => ({
    type: WireType.Varint,
    value: encodeZigzag(new Long(tsValue)),
  }),
  sint64: (tsValue) => ({
    type: WireType.Varint,
    value: encodeZigzag(tsValue),
  }),
  bool: (tsValue) => ({ type: WireType.Varint, value: new Long(+tsValue) }),
};

export const wireValueToTsValueFns: WireValueToTsValueFns = {
  ...varintFieldToTsValueFns,
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
  fixed32: (wireValue) => {
    if (wireValue.type !== WireType.Fixed32) return;
    return wireValue.value >>> 0;
  },
  fixed64: (wireValue) => {
    if (wireValue.type !== WireType.Fixed64) return;
    return wireValue.value.toString(false);
  },
  sfixed32: (wireValue) => {
    if (wireValue.type !== WireType.Fixed32) return;
    return wireValue.value | 0;
  },
  sfixed64: (wireValue) => {
    if (wireValue.type !== WireType.Fixed64) return;
    return wireValue.value.toString(true);
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

export const tsValueToWireValueFns: TsValueToWireValueFns = {
  ...tsValueToVarintFieldFns,
  double: (tsValue) => {
    const long = new Long();
    const dataview = new DataView(long.buffer);
    dataview.setFloat64(0, tsValue, true);
    return { type: WireType.Fixed64, value: long };
  },
  float: (tsValue) => {
    const u32 = new Uint32Array(1);
    const dataview = new DataView(u32.buffer);
    dataview.setFloat32(0, tsValue, true);
    return { type: WireType.Fixed32, value: dataview.getUint32(0, true) };
  },
  fixed32: (tsValue) => {
    // TODO
  },
  fixed64: (tsValue) => {
    // TODO
  },
  sfixed32: (tsValue) => {
    // TODO
  },
  sfixed64: (tsValue) => {
    // TODO
  },
  string: (tsValue) => {
    // TODO
  },
  bytes: (tsValue) => {
    // TODO
  },
};

type UnpackFns = {
  [type in keyof NumericWireValueToTsValueFns]: Unpack<
    NonNullable<ReturnType<NumericWireValueToTsValueFns[type]>>
  >;
};
const unpackVarintFns = Object.fromEntries(
  Object.keys(postprocessVarintFns).map((type) => [
    type,
    function* (wireValues: Iterable<Field>) {
      type Key = keyof typeof postprocessVarintFns;
      for (const wireValue of wireValues) {
        const value = wireValueToTsValueFns[type as Key](wireValue);
        if (value != null) yield value;
        else {
          for (const long of unpackVarint(wireValue)) {
            yield postprocessVarintFns[type as Key](long);
          }
        }
      }
    },
  ]),
) as {
  [type in keyof PostprocessVarintFns]: Unpack<
    NonNullable<ReturnType<PostprocessVarintFns[type]>>
  >;
};
export const unpackFns: UnpackFns = {
  ...unpackVarintFns,
  *double(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToTsValueFns.double(wireValue);
      if (value != null) yield value;
      else yield* unpackDouble(wireValue);
    }
  },
  *float(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToTsValueFns.float(wireValue);
      if (value != null) yield value;
      else yield* unpackFloat(wireValue);
    }
  },
  *fixed32(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToTsValueFns.fixed32(wireValue);
      if (value != null) yield value;
      else for (const value of unpackFixed32(wireValue)) yield value >>> 0;
    }
  },
  *fixed64(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToTsValueFns.fixed64(wireValue);
      if (value != null) yield value;
      else {
        for (const value of unpackFixed64(wireValue)) {
          yield value.toString(false);
        }
      }
    }
  },
  *sfixed32(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToTsValueFns.sfixed32(wireValue);
      if (value != null) yield value;
      else for (const value of unpackFixed32(wireValue)) yield value | 0;
    }
  },
  *sfixed64(wireValues) {
    for (const wireValue of wireValues) {
      const value = wireValueToTsValueFns.sfixed64(wireValue);
      if (value != null) yield value;
      else {
        for (const value of unpackFixed64(wireValue)) {
          yield value.toString(true);
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
    const decodeResult = decodeVarint(new DataView(value.buffer, offset + idx));
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
