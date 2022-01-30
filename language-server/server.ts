import {
  createJsonRpcConnection,
  NotificationHandlers,
  RequestHandlers,
} from "./json-rpc.ts";

export interface RunConfig {
  reader: Deno.Reader;
  writer: Deno.Writer;
}
export interface Server {
  finish(): void;
}
export function run(config: RunConfig): Server {
  const notificationHandlers: NotificationHandlers = {
    // TODO
  };
  const requestHandlers: RequestHandlers = {
    // TODO
  };
  const connection = createJsonRpcConnection({
    reader: config.reader,
    writer: config.writer,
    notificationHandlers,
    requestHandlers,
  });
  return {
    finish() {
      connection.finish();
    },
  };
}
