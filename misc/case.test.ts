import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import { snakeToCamel } from "./case.ts";

Deno.test("snakeToCamel", () => {
  assertEquals(snakeToCamel("foo"), "foo");
  assertEquals(snakeToCamel("foo_bar"), "fooBar");
  assertEquals(snakeToCamel("foo_bar_baz"), "fooBarBaz");
  assertEquals(snakeToCamel("foo__bar"), "fooBar");
  assertEquals(snakeToCamel(""), "");
  assertEquals(snakeToCamel("_"), "_");
  assertEquals(snakeToCamel("_foo"), "_foo");
  assertEquals(snakeToCamel("__foo"), "__foo");
  assertEquals(snakeToCamel("foo_"), "foo_");
  assertEquals(snakeToCamel("foo__"), "foo__");
  assertEquals(snakeToCamel("_foo_bar"), "_fooBar");
  assertEquals(snakeToCamel("foo_bar_"), "fooBar_");
  assertEquals(snakeToCamel("_foo_bar_"), "_fooBar_");
});
