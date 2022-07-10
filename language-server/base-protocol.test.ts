import { StringReader } from "https://deno.land/std@0.147.0/io/readers.ts";
import { Buffer } from "https://deno.land/std@0.147.0/io/buffer.ts";
import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.147.0/testing/asserts.ts";

import {
  readBaseProtocolMessages,
  writeBaseProtocolMessage,
} from "./base-protocol.ts";

Deno.test("base-protocol/readBaseProtocolMessages: Success", async () => {
  const body = `{"hello": "world"}`;
  const reader = new StringReader(
    [`Content-Length: ${body.length}`, "", body].join("\r\n"),
  );
  const message = (await readBaseProtocolMessages(reader).next()).value;
  assertEquals([...message.headers.entries()], [["content-length", "18"]]);
  assertEquals(message.body, new TextEncoder().encode(body));
});

Deno.test("base-protocol/readBaseProtocolMessages: Throw an error on malformed header", () => {
  const reader = new StringReader(
    `{}`,
  );
  assertRejects(
    () => readBaseProtocolMessages(reader).next(),
    Deno.errors.InvalidData,
  );
});

Deno.test("base-protocol/readBaseProtocolMessages: Throw an error on no content-length", () => {
  const reader = new StringReader(
    ["Weird-Header: 3", "", "{}"].join("\r\n"),
  );
  assertRejects(
    () => readBaseProtocolMessages(reader).next(),
    Error,
    "Header must provide a Content-Length property.",
  );
});

Deno.test("base-protocol/readBaseProtocolMessages: Throw an error on content-length is not a number", () => {
  const reader = new StringReader(
    ["Content-Length: a", "", "{}"].join("\r\n"),
  );
  assertRejects(
    () => readBaseProtocolMessages(reader).next(),
    Error,
    "Content-Length value must be a number.",
  );
});

Deno.test("base-protocol/writeBaseProtocolMessage: Success", async () => {
  const messageBuffer = new Buffer();
  const body = new TextEncoder().encode('{"hello": "world"}');

  await writeBaseProtocolMessage(messageBuffer, body);
  assertEquals(
    new TextDecoder().decode(messageBuffer.bytes()),
    `content-length: 18\r\n\r\n{"hello": "world"}`,
  );
});

Deno.test("base-protocol/writeBaseProtocolMessage: Success with headers", async () => {
  const messageBuffer = new Buffer();
  const body = new TextEncoder().encode('{"hello": "world"}');
  const headers = new Headers({ "header": "hi" });

  await writeBaseProtocolMessage(messageBuffer, body, headers);
  assertEquals(
    new TextDecoder().decode(messageBuffer.bytes()),
    `content-length: 18\r\nheader: hi\r\n\r\n{"hello": "world"}`,
  );
});
