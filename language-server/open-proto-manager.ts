import { parse, ParseResult } from "../core/parser/proto.ts";
import {
  createEventEmitter,
  EventEmitter,
} from "../core/runtime/async/event-emitter.ts";

export interface OpenProtoManager extends EventEmitter<OpenProtoManagerEvent> {
  upsert(uri: string, text: string): void;
  delete(uri: string): void;
  get(uri: string): string | undefined;
  getLastParsed(uri: string): string | undefined;
  getParseResult(uri: string): ParseResult | undefined;
}

interface OpenProtoManagerEvent {
  upsert: { uri: string; text: string };
  delete: { uri: string };
}

export function createOpenProtoManager(): OpenProtoManager {
  interface Proto {
    text: string;
    parseResult?: ParseResult;
  }
  const protos: { [uri: string]: Proto } = {};
  const eventEmitter = createEventEmitter<OpenProtoManagerEvent>();
  return {
    ...eventEmitter,
    upsert(uri, text) {
      eventEmitter.emit("upsert", { uri, text });
      protos[uri] ??= { text };
      try {
        protos[uri].parseResult = parse(text);
      } catch {}
    },
    delete(uri) {
      eventEmitter.emit("delete", { uri });
      delete protos[uri];
    },
    get(uri) {
      return protos[uri]?.text;
    },
    getLastParsed(uri) {
      return protos[uri]?.parseResult?.parser.input;
    },
    getParseResult(uri) {
      return protos[uri]?.parseResult;
    },
  };
}
