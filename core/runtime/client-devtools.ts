import type { RpcClientImpl } from "./rpc.ts";
import { map } from "./async/async-generator.ts";
import { createEventEmitter, EventEmitter } from "./async/event-emitter.ts";

export const devtoolsKey = "@pbkit/devtools";

export function getDevtoolsConfig(): DevtoolsConfig {
  const global = globalThis as any;
  if (!global[devtoolsKey]) {
    const devtoolsConfig = createDevtoolsConfig();
    return global[devtoolsKey] = devtoolsConfig;
  } else if (Array.isArray(global[devtoolsKey])) {
    const devtoolsConfig = createDevtoolsConfig();
    for (const fn of global[devtoolsKey]) {
      if (typeof fn !== "function") continue;
      fn(devtoolsConfig);
    }
    return global[devtoolsKey] = devtoolsConfig;
  } else {
    return global[devtoolsKey];
  }
}

export interface DevtoolsConfig extends EventEmitter<Events> {
  configId: string;
  requestIdCounter: number;
}
function createDevtoolsConfig(): DevtoolsConfig {
  const devtoolsConfig: DevtoolsConfig = {
    configId: String(Date.now()),
    requestIdCounter: 0,
    ...createEventEmitter(),
  };
  return devtoolsConfig;
}

export interface WrapRpcClientImplConfig<TMetadata, THeader, TTrailer> {
  rpcClientImpl: RpcClientImpl<TMetadata, THeader, TTrailer>;
  devtoolsConfig: DevtoolsConfig;
  tags: string[];
}
export function wrapRpcClientImpl<TMetadata, THeader, TTrailer>(
  config: WrapRpcClientImplConfig<TMetadata, THeader, TTrailer>,
): RpcClientImpl<TMetadata, THeader, TTrailer> {
  return function devtoolsRpcClientImpl(methodDescriptor) {
    const { rpcClientImpl, devtoolsConfig, tags } = config;
    const rpcMethodImpl = rpcClientImpl(methodDescriptor);
    return function devtoolsRpcMethodImpl(req, metadata) {
      const configId = devtoolsConfig.configId;
      const requestId = devtoolsConfig.requestIdCounter++;
      devtoolsConfig.emit("request", {
        requestId,
        configId,
        servicePath: methodDescriptor.service.serviceName,
        rpcName: methodDescriptor.methodName,
        metadataJson: toJson(metadata),
        tags,
      });
      const rpcMethodResult = rpcMethodImpl(
        map(req, (payload) => {
          devtoolsConfig.emit("request-payload", {
            requestId,
            configId,
            payloadJson: toJson(payload), // TODO: encode as json
            payloadProto: methodDescriptor.requestType.serializeBinary(payload),
          });
          return payload;
        }),
        metadata,
      );
      const resAsyncGenerator = map(rpcMethodResult[0], (payload) => {
        devtoolsConfig.emit("response-payload", {
          requestId,
          configId,
          payloadJson: toJson(payload), // TODO: encode as json
          payloadProto: methodDescriptor.responseType.serializeBinary(payload),
        });
        return payload;
      });
      const headerPromise = rpcMethodResult[1].then((header) => {
        devtoolsConfig.emit("response", {
          requestId,
          configId,
          headerJson: toJson(header),
        });
        return header;
      });
      const trailerPromise = rpcMethodResult[2].then((trailer) => {
        devtoolsConfig.emit("response-trailer", {
          requestId,
          configId,
          trailerJson: toJson(trailer),
        });
        return trailer;
      });
      return [resAsyncGenerator, headerPromise, trailerPromise];
    };
  };
}

function toJson(value: any): string {
  if ((!value) || (typeof value !== "object")) return "{}";
  return JSON.stringify(value);
}

export interface Events {
  "request": {
    configId: string;
    requestId: number;
    servicePath: string;
    rpcName: string;
    metadataJson: string;
    tags: string[];
  };
  "request-payload": {
    configId: string;
    requestId: number;
    payloadJson: string;
    payloadProto: Uint8Array;
  };
  "response": {
    configId: string;
    requestId: number;
    headerJson: string;
  };
  "response-payload": {
    configId: string;
    requestId: number;
    payloadJson: string;
    payloadProto: Uint8Array;
  };
  "response-trailer": {
    configId: string;
    requestId: number;
    trailerJson: string;
  };
}
