import type { MethodDescriptor } from "./rpc.ts";

export interface DevtoolsConfig {
  services: Set<Service>;
  subscribe: () => AsyncGenerator<Request>;
  emit: (request: Request) => void;
}

export interface Service {
  tags: string[];
  methodDescriptors: MethodDescriptors;
}

export interface Request {
  service: Service;
  methodName: string;
  // TODO
}

export interface MethodDescriptors {
  [methodName: string]: MethodDescriptor<any, any>;
}

export const devtoolsKey = "@pbkit/devtools";

export function getDevtoolsConfig(): DevtoolsConfig {
  const global = globalThis as any;
  return global[devtoolsKey] = global[devtoolsKey] || createDevtoolsConfig();
}

function createDevtoolsConfig(): DevtoolsConfig {
  interface Listener<T> {
    (value: T): void;
  }
  const listeners = new Set<Listener<Request>>();
  const services = new Set<Service>();
  function subscribe(): AsyncGenerator<Request> {
    const asyncIterator: AsyncGenerator<Request> = {
      [Symbol.asyncIterator]: () => asyncIterator,
      next() {
        return new Promise((resolve) => {
          const listener: Listener<Request> = (value) => {
            listeners.delete(listener);
            resolve({ done: false, value });
          };
          listeners.add(listener);
        });
      },
      return(value) {
        return Promise.resolve({ done: true, value });
      },
      throw(error) {
        return Promise.reject(error);
      },
    };
    return asyncIterator;
  }
  function emit(request: Request) {
    for (const listener of listeners) listener(request);
  }
  return { services, subscribe, emit };
}
