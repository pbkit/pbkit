import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import Long from "../Long.ts";
import { decode, encode } from "./zigzag.ts";

Deno.test("zigzag", () => {
  assertEquals(encode(0), 0);
  assertEquals(encode(-1), 1);
  assertEquals(encode(1), 2);
  assertEquals(encode(-2), 3);
  assertEquals(encode(2147483647), 4294967294);
  assertEquals(encode(-2147483648), 4294967295);
  assertEquals(encode(new Long(0)), new Long(0));
  assertEquals(encode(Long.parse("-1")), new Long(1));
  assertEquals(encode(new Long(1)), new Long(2));
  assertEquals(encode(Long.parse("-2")), new Long(3));
  assertEquals(encode(Long.parse("2147483647")), Long.parse("4294967294"));
  assertEquals(encode(Long.parse("-2147483648")), Long.parse("4294967295"));

  assertEquals(decode(encode(0)), 0);
  assertEquals(decode(encode(-1)), -1);
  assertEquals(decode(encode(1)), 1);
  assertEquals(decode(encode(-2)), -2);
  assertEquals(decode(encode(2147483647)), 2147483647);
  assertEquals(decode(encode(-2147483648)), -2147483648);
  assertEquals(decode(encode(new Long(0))), new Long(0));
  assertEquals(decode(encode(Long.parse("-1"))), Long.parse("-1"));
  assertEquals(decode(encode(new Long(1))), new Long(1));
  assertEquals(decode(encode(Long.parse("-2"))), Long.parse("-2"));
  assertEquals(
    decode(encode(Long.parse("2147483647"))),
    Long.parse("2147483647"),
  );
  assertEquals(
    decode(encode(Long.parse("-2147483648"))),
    Long.parse("-2147483648"),
  );
});
