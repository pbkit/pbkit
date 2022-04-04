import { assertEquals } from "https://deno.land/std@0.122.0/testing/asserts.ts";
import { toCamelCase } from "./case.ts";

Deno.test(function to_camel_case() {
  assertEquals(toCamelCase("ASDF"), "asdf");
  assertEquals(toCamelCase("ab_cDeF"), "abCDeF");
  assertEquals(toCamelCase("BcDE"), "bcDe");
  assertEquals(toCamelCase("Yahoo"), "yahoo");
});
