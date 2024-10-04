import {
  createSubscribeFn,
  defer,
  Observer,
  SubscribeFn,
} from "../core/runtime/async/observer.ts";

export interface ProgressResult {
  originalResponse: Response;
  response: Response;
  subscribeProgress: SubscribeFn<Progress>;
}
export interface Progress {
  current: number;
  total: number;
}
export function progressResponse(originalResponse: Response): ProgressResult {
  const deferredStart = defer<void>();
  const subscribeReader = readerToSubscribeFn(
    originalResponse.body?.getReader()!,
    deferredStart,
  );
  const contentLength = +originalResponse.headers.get("content-length")! | 0;
  let loaded = 0;
  let progressObserver: Observer<Progress> | null = null;
  const subscribeProgress: SubscribeFn<Progress> = (observer) => {
    progressObserver = observer;
    return () => {
      progressObserver = null;
      observer.complete();
    };
  };
  const response = new Response(
    new ReadableStream({
      start(controller) {
        subscribeReader({
          next({ value }) {
            if (!value) return;
            controller.enqueue(value);
            loaded += value.byteLength | 0;
            progressObserver?.next({
              current: loaded,
              total: contentLength,
            });
          },
          error(err) {
            controller.error(err);
            progressObserver?.error(err);
          },
          complete() {
            controller.close();
            progressObserver?.complete();
          },
        });
        deferredStart.resolve();
      },
    }),
  );
  return { originalResponse, response, subscribeProgress };
}

function readerToSubscribeFn<T>(
  reader: ReadableStreamDefaultReader<T>,
  wait = Promise.resolve(),
): SubscribeFn<ReadableStreamReadResult<T>> {
  return createSubscribeFn(async () => {
    const readResult = await reader.read();
    return [readResult, readResult.done];
  }, wait);
}
