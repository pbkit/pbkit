export type RpcClientImpl<TMetadata = any, THeader = any, TTrailer = any> = <
  TReq,
  TRes,
>(methodDescriptor: MethodDescriptor<TReq, TRes>) => (
  req: AsyncGenerator<TReq>,
  metadata?: TMetadata,
) => [AsyncGenerator<TRes>, Promise<THeader>, Promise<TTrailer>];

export interface MethodDescriptor<TReq, TRes> {
  methodName: string;
  service: { serviceName: string };
  requestStream: boolean;
  responseStream: boolean;
  requestType: {
    serializeBinary: (value: TReq) => Uint8Array;
    deserializeBinary: (value: Uint8Array) => TReq;
  };
  responseType: {
    serializeBinary: (value: TRes) => Uint8Array;
    deserializeBinary: (value: Uint8Array) => TRes;
  };
}

type ThenArg<T> = T extends Promise<infer U> ? U : T;
export type RpcReturnType<TRes, TResArgs extends any[]> = (
  Promise<TResArgs extends [] ? ThenArg<TRes> : [ThenArg<TRes>, ...TResArgs]>
);

export async function* singleValueToAsyncGenerator<T>(
  value: T,
): AsyncGenerator<T> {
  yield value;
}

export async function getFirstValueFromAsyncGenerator<T>(
  generator: AsyncGenerator<T>,
): Promise<T> {
  for await (const value of generator) return value;
  throw Error("The generator should yield at least one value.");
}
