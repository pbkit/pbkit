import { defer, Deferred } from "./observer.ts";

export interface EventBuffer<T> {
  push(value: T): void;
  error(error: Error): void;
  finish(): void;
  drain(): AsyncGenerator<T>;
}
export interface CreateEventBufferConfig {
  onDrainStart?: () => void;
  onDrainEnd?: () => void;
}
export function createEventBuffer<T>(
  config?: CreateEventBufferConfig,
): EventBuffer<T> {
  const queue: T[] = [];
  let deferred: Deferred<IteratorResult<T>> | undefined;
  let finished = false;
  return {
    push(value) {
      if (finished) throw new Error("can't push after finish");
      if (deferred) {
        deferred.resolve({ value, done: false });
        deferred = undefined;
      } else {
        queue.push(value);
      }
    },
    error(error) {
      deferred?.reject(error);
      finished = true;
    },
    finish() {
      deferred?.resolve({ value: undefined, done: true });
      finished = true;
    },
    drain() {
      config?.onDrainStart?.();
      const result: AsyncGenerator<T> = {
        [Symbol.asyncIterator]: () => result,
        next() {
          if (queue.length > 0) {
            return Promise.resolve({
              value: queue.shift()!,
              done: false,
            });
          } else {
            if (finished) {
              return Promise.resolve({ value: undefined, done: true });
            } else {
              return deferred = defer();
            }
          }
        },
        return(value) {
          config?.onDrainEnd?.();
          return Promise.resolve({ value, done: true });
        },
        throw(error) {
          config?.onDrainEnd?.();
          return Promise.reject(error);
        },
      };
      return result;
    },
  };
}
