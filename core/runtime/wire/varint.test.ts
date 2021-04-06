import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import Long, { compare } from "../Long.ts";
import { decode, encode } from "./varint.ts";

Deno.test("varint", () => {
  assertEquals(encode(300), Uint8Array.from([0b10101100, 0b00000010]));
  assertEquals(encode(150), Uint8Array.from([0b10010110, 0b00000001]));
  assertEquals(encode(12345), Uint8Array.from([0b10111001, 0b01100000]));
  assertEquals(
    encode(1234567890),
    Uint8Array.from([
      0b11010010,
      0b10000101,
      0b11011000,
      0b11001100,
      0b00000100,
    ]),
  ); // 1001001100101100000001011010010

  const decodeTest1 = new DataView(
    Uint8Array.from([0b10101100, 0b00000010]).buffer,
  );
  assertEquals(decode(decodeTest1)[0], 2);
  assertEquals(compare(<Long> decode(decodeTest1)[1], new Long(300)), 0);

  const decodeTest2 = new DataView(encode(1231241224).buffer);
  assertEquals(decode(decodeTest2)[0], 5);
  assertEquals(compare(<Long> decode(decodeTest2)[1], new Long(1231241224)), 0);

  const decodeTest3 = new DataView(encode(1234567890).buffer);
  assertEquals(decode(decodeTest3)[0], 5);
  assertEquals(compare(<Long> decode(decodeTest3)[1], new Long(1234567890)), 0);
});
