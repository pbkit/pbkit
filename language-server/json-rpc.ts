// @deno-types="https://esm.sh/v103/vscode-jsonrpc@8.0.0-next.6/lib/common/messages.d.ts"
import {
  ErrorCodes,
  Message,
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "https://esm.sh/v103/vscode-jsonrpc@8.0.0-next.6/lib/common/messages.js";
import { defer, Deferred } from "../core/runtime/async/observer.ts";
import {
  BaseProtocolMessage,
  readBaseProtocolMessages,
  writeBaseProtocolMessage,
} from "./base-protocol.ts";

export interface JsonRpcConnection {
  sendNotification(message: Omit<NotificationMessage, "jsonrpc">): void;
  sendRequest(
    message: Omit<RequestMessage, "id" | "jsonrpc">,
  ): Promise<ResponseMessage>;
  finish(): void;
}
export interface CreateJsonRpcConnectionConfig {
  reader: Deno.Reader;
  writer: Deno.Writer;
  notificationHandlers: NotificationHandlers;
  requestHandlers: RequestHandlers;
  logConfig?: CreateJsonRpcLogConfig;
}
export type CreateJsonRpcLogConfig = Partial<LogConfig>;
export interface LogConfig {
  logMessageMethod: string;
  showMessageRequestMethod: string;
  showMessageResponseMethod: string;
  sendReceivedMessageRequest: boolean;
  sendReceivedMessageResponse: boolean;
  sendReceivedNotification: boolean;
}
export interface NotificationHandlers {
  [methodName: string]: (params: any) => void;
}
export interface RequestHandlers {
  [methodName: string]: (params: any) => any;
}
export function createJsonRpcConnection(
  config: CreateJsonRpcConnectionConfig,
): JsonRpcConnection {
  let reqId = 0;
  let finished = false;
  const writeQueue = createJobQueue();
  const waitingRequests: Map<
    string | number | null,
    Deferred<ResponseMessage>
  > = new Map();
  const logConfig = Object.assign(
    getDefaultLogConfig(),
    config.logConfig ?? {},
  );
  function sendReceivedMessageRequestLog(message: Message) {
    writeMessage({
      method: logConfig.showMessageRequestMethod,
      params: {
        type: "info",
        message: `Received (Request): ${JSON.stringify(message)}`,
      },
      jsonrpc: "2.0",
    });
  }
  function sendReceivedMessageResponseLog(message: Message) {
    writeMessage({
      method: logConfig.showMessageResponseMethod,
      params: {
        type: "info",
        message: `Received (Response): ${JSON.stringify(message)}`,
      },
      jsonrpc: "2.0",
    });
  }
  function writeMessage<T extends Message>(message: T): void {
    writeQueue.push(() => {
      const body = new TextEncoder().encode(JSON.stringify(message));
      return writeBaseProtocolMessage(config.writer, body);
    });
  }
  function parseMessage(message: BaseProtocolMessage) {
    try {
      return JSON.parse(new TextDecoder().decode(message.body));
    } catch {
      writeMessage({
        jsonrpc: "2.0",
        id: null,
        error: ErrorCodes.ParseError,
        message: "Parse error",
      });
    }
  }
  (async function readLoop() {
    for await (const bpm of readBaseProtocolMessages(config.reader)) {
      try {
        const message = parseMessage(bpm);
        if (!message) continue;
        if (Message.isResponse(message)) {
          logConfig.sendReceivedMessageResponse &&
            sendReceivedMessageResponseLog(message);
          const request = waitingRequests.get(message.id);
          if (!request) {
            writeMessage({
              jsonrpc: "2.0",
              id: message.id,
              error: ErrorCodes.InternalError,
              message: "Received response to unknown request",
            });
            continue;
          }
          if ("error" in message) request.reject(message);
          else if ("result" in message) request.resolve(message);
        }
        if (Message.isRequest(message)) {
          logConfig.sendReceivedMessageRequest &&
            sendReceivedMessageRequestLog(message);
          if (!config.requestHandlers[message.method]) {
            writeMessage({
              jsonrpc: "2.0",
              id: message.id,
              error: ErrorCodes.MethodNotFound,
              message: "Method not found",
            });
            continue;
          }
          Promise.resolve(config.requestHandlers[message.method](
            message.params,
          )).then((result) =>
            writeMessage({
              jsonrpc: "2.0",
              id: message.id,
              result,
            })
          );
        }
        if (Message.isNotification(message)) {
          // Skip error on handling notification
          // https://www.jsonrpc.org/specification#notification
          if (config.notificationHandlers[message.method]) {
            config.notificationHandlers[message.method](message.params);
          }
        }
      } finally {
        if (finished) break;
      }
    }
  })();
  return {
    sendNotification(message) {
      writeMessage({ ...message, jsonrpc: "2.0" });
    },
    sendRequest(message) {
      const deferred = defer<ResponseMessage>();
      waitingRequests.set(reqId, deferred);
      writeMessage({ ...message, jsonrpc: "2.0", id: reqId++ });
      return deferred;
    },
    finish() {
      finished = true;
      [...waitingRequests.values()].forEach((request) => request.reject());
    },
  };
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface JobQueue {
  push(job: () => Promise<void>): void;
}
function createJobQueue(): JobQueue {
  let jobQueue: (() => Promise<void>)[] | undefined;
  function push(job: () => Promise<void>): void {
    if (!jobQueue) return void startLoop(job);
    else jobQueue.push(job);
  }
  async function startLoop(job: () => Promise<void>): Promise<void> {
    try {
      jobQueue = [job];
      while (jobQueue.length) {
        await jobQueue.shift()!();
        await tick();
      }
    } finally {
      jobQueue = undefined;
    }
  }
  return { push };
}

function getDefaultLogConfig(): LogConfig {
  // @TODO: Disable Log option on production deployment.
  return {
    logMessageMethod: "window/logMessage",
    showMessageRequestMethod: "window/showMessageRequest",
    showMessageResponseMethod: "window/showMessageResponse",
    sendReceivedNotification: true,
    sendReceivedMessageRequest: true,
    sendReceivedMessageResponse: true,
  };
}
