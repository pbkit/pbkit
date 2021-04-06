import Long, { add, compare, mul } from "../Long.ts";

export function encode(value: number | Long): Uint8Array {
  const result: number[] = [];
  const zero = new Long(0);
  const chunkMax = 0b1111111;
  const head = 1 << 7;
  let long = typeof value === "number" ? new Long(value) : value;
  while (compare(long, zero) !== 0) {
    const [lo, hi] = long;
    const chunk = lo & chunkMax;
    const nextHi = hi >>> 7;
    const nextLo = (lo >>> 7) | ((hi & chunkMax) << (32 - 7));
    long = new Long(nextLo, nextHi);
    const resultChunk = compare(long, zero) === 0 ? chunk : chunk | head;
    result.push(resultChunk);
  }
  return Uint8Array.from(result);
}

export type DecodeResult = [
  number, // byte count
  number | Long, // value
];
export function decode(dataview: DataView): DecodeResult {
  const chunkMax = 0b1111111;
  const length = dataview.byteLength;
  let result = new Long(0);
  let powByByte = new Long(1);
  for (let idx = 0; idx < length; idx++) {
    const byte = dataview.getUint8(idx);
    const isContinue = byte & (1 << 7);
    const value = byte & chunkMax;
    result = add(result, mul(powByByte, new Long(value)));
    powByByte = mul(powByByte, new Long(1 << 7));
    if (!isContinue) {
      return [idx + 1, result[0] > 0 ? result : result[1]];
    }
  }
  return [0, 0];
}
