export type RpcImpl<TReq, TRes, TMetadata> = (
  servicePath: string,
  methodName: string,
  utilFns: RpcImplUtilFns<TReq, TRes>,
) => (req: AsyncGenerator<TReq>, metadata?: TMetadata) => AsyncGenerator<TRes>;

export interface RpcImplUtilFns<TReq, TRes> {
  encodeRequestBinary: (value: TReq) => Uint8Array;
  decodeRequestBinary: (value: Uint8Array) => TReq;
  encodeResponseBinary: (value: TRes) => Uint8Array;
  decodeResponseBinary: (value: Uint8Array) => TRes;
}

export async function* singleValueToAsyncGenerator<T>(
  value: T,
): AsyncGenerator<T> {
  yield value;
}

export async function getFirstValueFromAsyncGenerator<T>(
  generator: AsyncGenerator<T>,
): Promise<T | undefined> {
  for await (const value of generator) return value;
  return undefined;
}
