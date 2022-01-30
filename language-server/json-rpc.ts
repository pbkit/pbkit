// @deno-types="https://esm.sh/vscode-jsonrpc@6.0.0/lib/common/messages.d.ts"
import {
  ErrorCodes,
  isResponseMessage,
  Message,
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "https://esm.sh/vscode-jsonrpc@6.0.0/lib/common/messages.js";
import { defer, Deferred } from "../core/runtime/async/observer.ts";
import {
  BaseProtocolMessage,
  readBaseProtocolMessages,
  writeBaseProtocolMessage,
} from "./base-protocol.ts";

export interface JsonRpcConnection {
  sendNotification(message: NotificationMessage): void;
  sendRequest(message: RequestMessage): Promise<ResponseMessage>;
  finish(): void;
}
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
  config: CreateJsonRpcConnectionConfig
): JsonRpcConnection {
  let finished = false;
  const writeQueue = createJobQueue();
  const waitingRequests: Map<
    string | number | null,
    Deferred<ResponseMessage>
  > = new Map();
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
        if (isResponseMessage(message)) {
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
        // TODO: handle request, notification
      } finally {
        if (finished) break;
      }
    }
  })();
  return {
    sendNotification: writeMessage,
    sendRequest(message) {
      const deferred = defer<ResponseMessage>();
      waitingRequests.set(message.id, deferred);
      writeMessage(message);
      return deferred;
    },
    finish() {
      finished = true;
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
