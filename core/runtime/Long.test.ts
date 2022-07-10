import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import Long from "./Long.ts";

Deno.test("parse", () => {
  assertEquals(Long.parse("-1").toString(), "-1");
  assertEquals(Long.parse("-1").toString(false), "18446744073709551615");
  assertEquals(Long.parse("-0").toString(), "0");
  assertEquals(Long.parse("0").toString(), "0");
  assertEquals(Long.parse("1").toString(), "1");
  assertEquals(Long.parse("4294967295").toString(), "4294967295");
  assertEquals(Long.parse("4294967296").toString(), "4294967296");
  assertEquals(
    Long.parse("9223372036854775807").toString(),
    "9223372036854775807",
  );
  assertEquals(
    Long.parse("9223372036854775808").toString(),
    "-9223372036854775808",
  );
  assertEquals(
    Long.parse("9223372036854775808").toString(false),
    "9223372036854775808",
  );
  assertEquals(Long.parse("18446744073709551615").toString(), "-1");
});
