import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import { sanitizeFieldName, toCamelCase } from "./name.ts";

Deno.test(function to_camel_case() {
  assertEquals(toCamelCase("ASDF"), "asdf");
  assertEquals(toCamelCase("ab_cDeF"), "abCDeF");
  assertEquals(toCamelCase("BcDE"), "bcDe");
  assertEquals(toCamelCase("Yahoo"), "yahoo");
});

Deno.test(function sanitize_field_name() {
  assertEquals(sanitizeFieldName("hasProduct"), "hasProduct_p");
  assertEquals(sanitizeFieldName("has"), "has");
  assertEquals(sanitizeFieldName("clearSomething"), "clearSomething_p");
  assertEquals(sanitizeFieldName("clear"), "clear");
  assertEquals(sanitizeFieldName("self"), "self_p");
  assertEquals(sanitizeFieldName("Self"), "`Self`");
});
