import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import { compareRev } from "./rev.ts";

Deno.test("rev.compareRev", () => {
  assertEquals(
    [
      "",
      "master",
      "1.2.3",
      "dev",
      "v1.2.3-foo",
      "1.2.3-foo",
      "v1.2.2",
      "0.0.0",
      "0",
      "1.1",
      "0.0",
      "main",
      "long-branch-name",
      "asdf",
      "fdsa",
      "z",
    ].sort(compareRev),
    [
      "0.0.0",
      "v1.2.2",
      "1.2.3-foo",
      "v1.2.3-foo",
      "1.2.3",
      "",
      "0",
      "0.0",
      "1.1",
      "asdf",
      "dev",
      "fdsa",
      "long-branch-name",
      "main",
      "master",
      "z",
    ],
  );
});
