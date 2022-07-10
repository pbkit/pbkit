import { copy } from "https://deno.land/std@0.147.0/bytes/mod.ts";
import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import { BufReader } from "https://deno.land/std@0.147.0/io/buffer.ts";
import { createEventBuffer } from "../core/runtime/async/event-buffer.ts";
import { defer } from "../core/runtime/async/observer.ts";
import { createJsonRpcConnection } from "./json-rpc.ts";

function createBuffer(): Deno.Reader & Deno.Writer {
  const eventBuffer = createEventBuffer<Uint8Array>();
  const asyncGenerator = eventBuffer.drain();
  const reader: Deno.Reader = {
    async read(p) {
      const result = await asyncGenerator.next();
      if (!result) return null;
      return copy(result.value, p, 0);
    },
  };
  const bufReader = new BufReader(reader);
  return {
    read(p) {
      return bufReader.read(p);
    },
    async write(p) {
      eventBuffer.push(p);
      return await Promise.resolve(p.length);
    },
  };
}

Deno.test("json-rpc/sendRequest: Handling request properly", async () => {
  let result: string | undefined;
  const buffer1 = createBuffer();
  const buffer2 = createBuffer();
  const sender = createJsonRpcConnection({
    reader: buffer1,
    writer: buffer2,
    requestHandlers: {},
    notificationHandlers: {},
  });
  createJsonRpcConnection({
    reader: buffer2,
    writer: buffer1,
    requestHandlers: {
      test(params) {
        result = params[0];
        return Promise.resolve(result);
      },
    },
    notificationHandlers: {},
  });
  const response = await sender.sendRequest({
    method: "test",
    params: ["hello"],
  });

  assertEquals(response, {
    id: 0,
    jsonrpc: "2.0",
    result: "hello",
  });
  assertEquals(result, "hello");
});

Deno.test("json-rpc/sendNotification: Handling notification properly", async () => {
  let result = defer<string>();
  const buffer1 = createBuffer();
  const buffer2 = createBuffer();
  const sender = createJsonRpcConnection({
    reader: buffer1,
    writer: buffer2,
    requestHandlers: {},
    notificationHandlers: {},
  });
  createJsonRpcConnection({
    reader: buffer2,
    writer: buffer1,
    requestHandlers: {},
    notificationHandlers: {
      test(params) {
        result.resolve(params[0]);
        return Promise.resolve();
      },
    },
  });
  sender.sendNotification({
    method: "test",
    params: ["hello"],
  });

  assertEquals(await result, "hello");
});
