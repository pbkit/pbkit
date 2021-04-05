import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import Long, { compare } from "../Long.ts";
import { decode, encode } from "./varint.ts";

Deno.test("varint", () => {
  assertEquals(encode(300), Uint8Array.from([0b10101100, 0b00000010])); // [172, 2]
  assertEquals(encode(1), Uint8Array.from([1]));
  const decodeTest1 = new DataView(Uint8Array.from([0b10101100, 0b00000010]).buffer);
  assert(decode(decodeTest1)[0] === 2);
  assert(compare(<Long>decode(decodeTest1)[1], new Long(300)) === 0);
  const decodeTest2 = new DataView(encode(123124125324).buffer);
  assert(compare(<Long>decode(decodeTest2)[1], new Long(123124125324)) === 0)
});
