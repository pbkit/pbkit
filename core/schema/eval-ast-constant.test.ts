import { assertEquals } from "https://deno.land/std@0.122.0/testing/asserts.ts";
import * as ast from "../ast/index.ts";
import { evalStrLit } from "./eval-ast-constant.ts";

Deno.test("evalStrLit", () => {
  assertEquals(evalStrLit(strLit(String.raw`"\x08"`)), "\x08");
  assertEquals(evalStrLit(strLit(String.raw`"\377"`)), "\xFF");
  assertEquals(evalStrLit(strLit(String.raw`"\541"`)), "a");
  assertEquals(evalStrLit(strLit(String.raw`"\a"`)), "\x07");
  assertEquals(evalStrLit(strLit(String.raw`"\n"`)), "\n");
  assertEquals(evalStrLit(strLit(String.raw`"\0"`)), "\0");
  assertEquals(evalStrLit(strLit(String.raw`"\\"`)), "\\");
  assertEquals(evalStrLit(strLit(String.raw`"\""`)), '"');
  assertEquals(evalStrLit(strLit(String.raw`"\'"`)), "'");
  assertEquals(evalStrLit(strLit(String.raw`"'"`)), "'");
  assertEquals(evalStrLit(strLit(String.raw`'"'`)), '"');
  assertEquals(
    evalStrLit(strLit(String.raw`"Hello, World!"`)),
    "Hello, World!",
  );
});

function strLit(text: string): ast.StrLit {
  return {
    start: 0,
    end: 0,
    tokens: [{ start: 0, end: 0, text }],
    type: "str-lit",
  };
}
