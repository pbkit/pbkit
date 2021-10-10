export interface EventBuffer<T> {
  push(value: T): void;
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
  let resolve: ((v: IteratorResult<T>) => void) | undefined = undefined;
  let finished = false;
  return {
    push(value) {
      if (finished) throw new Error("can't push after finish");
      if (resolve) {
        resolve({ value, done: false });
        resolve = undefined;
      } else {
        queue.push(value);
      }
    },
    finish() {
      resolve && resolve({ value: undefined, done: true });
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
              return new Promise((r) => (resolve = r));
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
