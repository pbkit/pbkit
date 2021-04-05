import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import { WireMessage, WireType } from "./index.ts";
import serialize from "./serialize.ts";

Deno.test("serialize", () => {
  const message1: WireMessage = [[2, {
    type: WireType.LengthDelimited,
    value: new Uint8Array(1),
  }]];
  console.log(serialize(message1));
  const message2: WireMessage = [[1, {
    type: WireType.Varint,
    value: 150,
  }]];
  console.log(serialize(message2));
});
