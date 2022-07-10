import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import Long from "../Long.ts";
import deserialize from "./deserialize.ts";
import { WireMessage, WireType } from "./index.ts";
import { concat } from "./serialize.ts";

Deno.test("deserialize", () => {
  const varint: WireMessage = [[1, {
    type: WireType.Varint,
    value: new Long(150),
  }]];
  assertEquals(deserialize(new Uint8Array([0x08, 0x96, 0x01])), varint);

  const fixed64: WireMessage = [[2, {
    type: WireType.Fixed64,
    value: Long.parse("12345678999"),
  }]];
  assertEquals(
    deserialize(concat([
      new Uint8Array([0x11]),
      new Uint8Array(new Uint32Array(Long.parse("12345678999")).buffer),
    ])),
    fixed64,
  );

  const lengthDelimited: WireMessage = [[3, {
    type: WireType.LengthDelimited,
    value: new Uint8Array(1),
  }]];
  assertEquals(
    deserialize(new Uint8Array([0x1A, 0x01, 0x00])),
    lengthDelimited,
  );

  const lengthDelimitedString: WireMessage = [[3, {
    type: WireType.LengthDelimited,
    value: new TextEncoder().encode("testing"),
  }]];
  assertEquals(
    deserialize(
      new Uint8Array([0x1A, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67]),
    ),
    lengthDelimitedString,
  );

  const fixed32: WireMessage = [[4, {
    type: WireType.Fixed32,
    value: 123456789, // 0x075BCD15
  }]];
  assertEquals(
    deserialize(new Uint8Array([0x25, 0x15, 0xCD, 0x5B, 0x07])),
    fixed32,
  );

  const longMessage: WireMessage = [[1, {
    type: WireType.LengthDelimited,
    value: new Uint8Array(1),
  }], [2, {
    type: WireType.Varint,
    value: new Long(150),
  }], [3, {
    type: WireType.LengthDelimited,
    value: new TextEncoder().encode("testing"),
  }]];
  assertEquals(
    deserialize(
      new Uint8Array([
        0x0A,
        0x01,
        0x00,
        0x10,
        0x96,
        0x01,
        0x1A,
        0x07,
        0x74,
        0x65,
        0x73,
        0x74,
        0x69,
        0x6e,
        0x67,
      ]),
    ),
    longMessage,
  );

  assertEquals(
    deserialize(new Uint8Array([0x08, 0x00, 0x10, 0x01, 0x18, 0x02])),
    [
      [1, { type: 0, value: new Long(0) }],
      [2, { type: 0, value: new Long(1) }],
      [3, { type: 0, value: new Long(2) }],
    ],
  );
});
