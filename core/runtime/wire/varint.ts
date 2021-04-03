import Long from "../Long.ts";

export function encode(value: number | Long): Uint8Array {
  throw "TODO";
}

export type DecodeResult = [
  number, // byte count
  number | Long, // value
];
export function decode(dataview: DataView): DecodeResult {
  throw "TODO";
}
