// @deno-types="https://unpkg.com/vscode-jsonrpc@6.0.0/lib/common/messages.d.ts"
import {
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "https://unpkg.com/vscode-jsonrpc@6.0.0/lib/common/messages.js";

export interface JsonRpcConnection {
  sendNotification(message: NotificationMessage): Promise<void>;
  sendRequest(message: RequestMessage): Promise<ResponseMessage>;
  listen(): Close;
}
export type Close = () => void;
export interface CreateJsonRpcConnectionConfig {
  reader: Deno.Reader;
  writer: Deno.Writer;
  notificationHandlers: NotificationHandlers;
  requestHandlers: RequestHandlers;
}
export interface NotificationHandlers {
  [methodName: string]: (params: any) => Promise<void>;
}
export interface RequestHandlers {
  [methodName: string]: (params: any) => Promise<any>;
}
export function createJsonRpcConnection(
  config: CreateJsonRpcConnectionConfig,
): JsonRpcConnection {
  return {
    async sendNotification(message) {
      // TODO
    },
    async sendRequest(message) {
      return null as any; // TODO
    },
    listen() {
      return null as any; // TODO
    },
  };
}
